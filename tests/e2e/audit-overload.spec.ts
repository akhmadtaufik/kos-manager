import { test, expect } from '@playwright/test';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_MIGRATE_URL || 'postgres://postgres:Rnpl1105@localhost:5432/kosmanager_db');

const ownerEmail = `owner_overload_${Date.now()}@test.com`;
const opAEmail = `opA_overload_${Date.now()}@test.com`;
const opBEmail = `opB_overload_${Date.now()}@test.com`;
const testPassword = 'Password123!';

let ownerId: string;
let opAId: string;
let opBId: string;
let propertyId: string;

test.describe.serial('Data Overload & Filtering Journey', () => {

  test.beforeAll(async ({ request }) => {
    // 1. Register Owner
    let res = await request.post('/api/auth/register', {
      data: { email: ownerEmail, password: testPassword, name: 'Owner Overload', role: 'owner' }
    });
    expect(res.ok()).toBeTruthy();

    // 2. Register Operators
    res = await request.post('/api/auth/register', {
      data: { email: opAEmail, password: testPassword, name: 'Operator A', role: 'operator' }
    });
    expect(res.ok()).toBeTruthy();

    res = await request.post('/api/auth/register', {
      data: { email: opBEmail, password: testPassword, name: 'Operator B', role: 'operator' }
    });
    expect(res.ok()).toBeTruthy();

    // 3. Get IDs and force roles
    const ownerRows = await sql`SELECT id FROM users WHERE email = ${ownerEmail}`;
    ownerId = ownerRows[0].id;
    const opARows = await sql`SELECT id FROM users WHERE email = ${opAEmail}`;
    opAId = opARows[0].id;
    const opBRows = await sql`SELECT id FROM users WHERE email = ${opBEmail}`;
    opBId = opBRows[0].id;

    await sql`UPDATE users SET role = 'owner' WHERE id = ${ownerId}`;
    await sql`UPDATE users SET role = 'operator' WHERE id IN (${opAId}, ${opBId})`;

    // 4. Create Property & Link Operators
    const propRes = await sql`
      INSERT INTO properties (user_id, name, address) 
      VALUES (${ownerId}, 'Overload Mansion', 'Data St.') 
      RETURNING id
    `;
    propertyId = propRes[0].id;

    await sql`
      INSERT INTO user_properties (user_id, property_id, permissions) 
      VALUES (${opAId}, ${propertyId}, '["manage_rooms"]'::jsonb),
             (${opBId}, ${propertyId}, '["manage_rooms"]'::jsonb)
    `;

    // 5. Mass Seed Activity Logs (55 total)
    // - 40 for Operator A
    // - 10 for Operator B
    // - 5 for Owner
    
    // Reverse chronological insertion to match expected view (latest first)
    const logsToInsert = [];
    
    for (let i = 0; i < 40; i++) {
      logsToInsert.push({ user_id: opAId, actor_name: 'Operator A', actor_role: 'operator', action: `ACTION_A_${i}`, entity_type: 'test' });
    }
    for (let i = 0; i < 10; i++) {
      logsToInsert.push({ user_id: opBId, actor_name: 'Operator B', actor_role: 'operator', action: `ACTION_B_${i}`, entity_type: 'test' });
    }
    for (let i = 0; i < 5; i++) {
      logsToInsert.push({ user_id: ownerId, actor_name: 'Owner Overload', actor_role: 'owner', action: `ACTION_OWNER_${i}`, entity_type: 'test' });
    }

    // Insert all at once using postgres.js helper
    await sql`
      INSERT INTO activity_logs ${sql(logsToInsert)}
    `;
  });

  test.afterAll(async () => {
    await sql`DELETE FROM users WHERE email IN (${ownerEmail}, ${opAEmail}, ${opBEmail})`;
    await sql.end();
  });

  test('E2E Data Overload: Pagination and dynamic Filtering', async ({ page }) => {
    // Phase 1: Login and verify pagination DOM
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('input#login-email').fill(ownerEmail);
    await page.locator('input#login-password').fill(testPassword);
    
    let loginPromise = page.waitForResponse(res => res.url().includes('/api/auth/callback/credentials'));
    await page.locator('form').filter({ has: page.locator('input#login-email') }).locator('button[type="submit"]').click();
    await loginPromise;
    await page.waitForURL('**/dashboard');

    await page.evaluate(() => {
      // @ts-ignore
      window.useNuxtApp().$router.push('/dashboard/activity');
    });
    
    // Wait for the audit API to finish
    await page.waitForResponse(res => res.url().includes('/api/audit') && res.status() === 200);

    // Default limit is 15 in UI (per activity.vue)
    // Wait for phantom skeleton to disappear
    await expect(page.locator('phantom-ui')).not.toBeVisible();
    
    // Assert 15 rows rendered
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(15);
    
    // Click Next Page
    const nextBtn = page.locator('button:has-text("Next")').last();
    
    // Watch for the next network request
    const nextReqPromise = page.waitForResponse(res => res.url().includes('page=2'));
    await nextBtn.click();
    await nextReqPromise;
    
    // Wait for loading to finish and assert 15 rows again
    await expect(page.locator('phantom-ui')).not.toBeVisible();
    await expect(rows).toHaveCount(15);

    // Phase 2: Filter by Operator B
    // Wait for operators API if any
    const selectEl = page.locator('select#actor-filter-select');
    
    // The filter value for operator B will be 'user:' + opBId
    // Because we generate options from the operators list
    // We can select by label "Operator B (Operator)"
    
    const filterReqPromise = page.waitForResponse(res => res.url().includes(`operatorId=${opBId}`));
    await selectEl.selectOption({ label: 'Operator B (Operator)' });
    
    // Assert skeleton loader shows up
    await expect(page.locator('phantom-ui')).toBeVisible();
    await filterReqPromise;
    
    // Assert 10 rows for Operator B
    await expect(page.locator('phantom-ui')).not.toBeVisible();
    await expect(rows).toHaveCount(10);
    
    // Make sure they are Operator B's actions
    const firstRowText = await rows.first().textContent();
    expect(firstRowText).toContain('Operator B');
    
    // Pagination should show "Showing page 1 of 1" since 10 < 15
    const paginationText = page.locator('p:has-text("Showing page")');
    await expect(paginationText).toHaveCount(0); // If totalPages <= 1, the pagination div is v-if'd out!
  });

});
