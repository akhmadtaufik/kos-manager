import { test, expect } from '@playwright/test';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_MIGRATE_URL || 'postgres://postgres:Rnpl1105@localhost:5432/kosmanager_db');

const ownerEmail = `owner_iso_${Date.now()}@test.com`;
const operatorEmail = `operator_iso_${Date.now()}@test.com`;
const testUserEmail = `test_user_iso_${Date.now()}@test.com`;
const testPassword = 'Password123!';

let ownerId: string;
let operatorId: string;
let testUserId: string;
let propertyId: string;

test.describe.serial('Audit Isolation Journey', () => {

  test.beforeAll(async ({ request }) => {
    // Register Owner A
    let res = await request.post('/api/auth/register', {
      data: { email: ownerEmail, password: testPassword, name: 'Owner A', role: 'owner' }
    });
    expect(res.ok()).toBeTruthy();

    // Register Operator A
    res = await request.post('/api/auth/register', {
      data: { email: operatorEmail, password: testPassword, name: 'Operator A', role: 'operator' }
    });
    expect(res.ok()).toBeTruthy();

    // Register Test User (Owner B)
    res = await request.post('/api/auth/register', {
      data: { email: testUserEmail, password: testPassword, name: 'Test User', role: 'owner' }
    });
    expect(res.ok()).toBeTruthy();

    const ownerRows = await sql`SELECT id FROM users WHERE email = ${ownerEmail}`;
    ownerId = ownerRows[0].id;

    const opRows = await sql`SELECT id FROM users WHERE email = ${operatorEmail}`;
    operatorId = opRows[0].id;

    const testUserRows = await sql`SELECT id FROM users WHERE email = ${testUserEmail}`;
    testUserId = testUserRows[0].id;

    await sql`UPDATE users SET role = 'owner' WHERE id = ${ownerId}`;
    await sql`UPDATE users SET role = 'operator' WHERE id = ${operatorId}`;
    await sql`UPDATE users SET role = 'owner' WHERE id = ${testUserId}`;

    // Create Property for Owner A
    const propRes = await sql`
      INSERT INTO properties (user_id, name, address) 
      VALUES (${ownerId}, 'Isolation Property', '123 Secure Lane') 
      RETURNING id
    `;
    propertyId = propRes[0].id;

    // Bind Operator A to Property
    await sql`
      INSERT INTO user_properties (user_id, property_id, permissions) 
      VALUES (${operatorId}, ${propertyId}, '["manage_tenants"]'::jsonb)
    `;

    // Add unique activity logs
    // Owner A log
    await sql`
      INSERT INTO activity_logs (user_id, actor_name, actor_role, action, entity_type, details)
      VALUES (${ownerId}, 'Owner A', 'owner', 'CREATE_PROPERTY', 'property', '{"name": "Isolation Property"}'::jsonb)
    `;

    // Operator A log
    await sql`
      INSERT INTO activity_logs (user_id, actor_name, actor_role, action, entity_type, details)
      VALUES (${operatorId}, 'Operator A', 'operator', 'CHECKIN_TENANT', 'tenant', '{"name": "Op A Tenant"}'::jsonb)
    `;

    // Test User log
    await sql`
      INSERT INTO activity_logs (user_id, actor_name, actor_role, action, entity_type, details)
      VALUES (${testUserId}, 'Test User', 'owner', 'TEST_ACTION', 'test', '{"msg": "Should be hidden"}'::jsonb)
    `;

    // System log
    await sql`
      INSERT INTO activity_logs (user_id, actor_name, actor_role, action, entity_type, details)
      VALUES (NULL, 'System', 'system', 'SYSTEM_CRON', 'system', '{"msg": "System cleanup"}'::jsonb)
    `;
  });

  test.afterAll(async () => {
    await sql`DELETE FROM users WHERE email IN (${ownerEmail}, ${operatorEmail}, ${testUserEmail})`;
    await sql.end();
  });

  test('E2E Audit Isolation: Owner only sees their logs and their operators', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Log in as Owner A
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('input#login-email').click();
    await page.locator('input#login-email').fill(ownerEmail);
    await page.locator('input#login-password').click();
    await page.locator('input#login-password').fill(testPassword);
    
    let loginPromise = page.waitForResponse(res => res.url().includes('/api/auth/callback/credentials'));
    await page.locator('form').filter({ has: page.locator('input#login-email') }).locator('button[type="submit"]').click();
    await loginPromise;

    // Navigate to dashboard/activity
    await page.waitForURL('**/dashboard');
    await page.waitForSelector('h1:has-text("Dashboard Overview")');

    await page.evaluate(() => {
      // @ts-ignore
      window.useNuxtApp().$router.push('/dashboard/activity');
    });
    await page.waitForURL('**/dashboard/activity', { timeout: 10000 });

    await page.waitForTimeout(3000); // Give it time to load data

    // Assert Success:
    // We should see Owner A and Operator A actions
    await expect(page.locator('tbody')).toContainText('Create Property');
    await expect(page.locator('tbody')).toContainText('Owner A');

    await expect(page.locator('tbody')).toContainText('Checkin Tenant');
    await expect(page.locator('tbody')).toContainText('Operator A');

    // Assert Isolation:
    // We should ABSOLUTELY NOT see Test User and System logs
    const textContent = await page.locator('tbody').textContent();
    expect(textContent).not.toContain('Test Action');
    expect(textContent).not.toContain('Test User');
    expect(textContent).not.toContain('System Cron');
    expect(textContent).not.toContain('System cleanup');

    await context.close();
  });

});
