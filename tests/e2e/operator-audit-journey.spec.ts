import { test, expect } from '@playwright/test';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_MIGRATE_URL || 'postgres://postgres:Rnpl1105@localhost:5432/kosmanager_db');

const ownerEmail = `owner_audit_${Date.now()}@test.com`;
const operatorEmail = `operator_audit_${Date.now()}@test.com`;
const testPassword = 'Password123!';

let propertyId: string;
let roomId: string;
let ownerId: string;
let operatorId: string;

test.describe.serial('Operator Audit Security Journey', () => {

  test.beforeAll(async ({ request }) => {
    // 1. Register Owner
    let res = await request.post('/api/auth/register', {
      data: { email: ownerEmail, password: testPassword, name: 'Audit Owner', role: 'owner' }
    });
    expect(res.ok()).toBeTruthy();

    // 2. Register Operator
    res = await request.post('/api/auth/register', {
      data: { email: operatorEmail, password: testPassword, name: 'Malicious Operator', role: 'operator' }
    });
    expect(res.ok()).toBeTruthy();

    // 3. Fetch IDs from DB to set up RBAC manually
    const ownerRows = await sql`SELECT id FROM users WHERE email = ${ownerEmail}`;
    ownerId = ownerRows[0].id;
    
    const opRows = await sql`SELECT id FROM users WHERE email = ${operatorEmail}`;
    operatorId = opRows[0].id;

    // Set roles explicitly just in case registration didn't apply them fully (e.g. pending state)
    await sql`UPDATE users SET role = 'owner' WHERE id = ${ownerId}`;
    await sql`UPDATE users SET role = 'operator' WHERE id = ${operatorId}`;

    // 4. Create Property (as owner)
    // We'll just insert directly to avoid dealing with session cookies in beforeAll
    const propRes = await sql`
      INSERT INTO properties (user_id, name, address) 
      VALUES (${ownerId}, 'Audit Test Property', '123 Secure Lane') 
      RETURNING id
    `;
    propertyId = propRes[0].id;

    // 5. Create Room
    const roomRes = await sql`
      INSERT INTO rooms (property_id, room_number, monthly_rate) 
      VALUES (${propertyId}, 'A1', 1500000) 
      RETURNING id
    `;
    roomId = roomRes[0].id;

    // 6. Bind Operator to Property
    await sql`
      INSERT INTO user_properties (user_id, property_id, permissions) 
      VALUES (${operatorId}, ${propertyId}, '["manage_tenants"]'::jsonb)
    `;
  });

  test.afterAll(async () => {
    await sql`DELETE FROM users WHERE email IN (${ownerEmail}, ${operatorEmail})`;
    await sql.end();
  });

  test('E2E Audit Journey: Operator acts, Owner verifies', async ({ browser, request }) => {
    // ---- Phase 1: Authorized Task (Good Behavior) ----
    const operatorContext = await browser.newContext();
    const opPage = await operatorContext.newPage();
    
    await opPage.goto('/');
    await opPage.waitForLoadState('networkidle');
    await opPage.locator('input#login-email').click();
    await opPage.locator('input#login-email').fill(operatorEmail);
    await opPage.locator('input#login-password').click();
    await opPage.locator('input#login-password').fill(testPassword);
    
    let loginPromise = opPage.waitForResponse(res => res.url().includes('/api/auth/callback/credentials'));
    await opPage.locator('form').filter({ has: opPage.locator('input#login-email') }).locator('button[type="submit"]').click();
    await loginPromise;

    // Navigate to dashboard
    await opPage.waitForURL(/\/dashboard/);

    // Operator registers a tenant via API
    const addTenantRes = await operatorContext.request.post('/api/tenants', {
      data: {
        propertyId,
        roomId,
        name: 'John Honest Doe',
        phone: '08123456789',
        checkIn: new Date().toISOString()
      }
    });
    expect(addTenantRes.ok()).toBeTruthy();

    // ---- Phase 2: Unauthorized Task (Cheating Simulation) ----
    // Operator attempts to DELETE the property directly via API
    const hackRes = await operatorContext.request.delete(`/api/properties/${propertyId}`);
    
    // Assert the backend strictly caught it
    expect(hackRes.status()).toBe(403);
    
    await operatorContext.close(); // Clean up operator session

    // ---- Phase 3: Owner Audit Verification (The CCTV) ----
    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();

    // Open owner page and listen to console to see the JSON payload
    ownerPage.on('console', msg => {
      console.log(`OWNER CONSOLE: ${msg.text()}`);
    });
    ownerPage.on('pageerror', err => console.log('OWNER ERROR:', err.message));

    // Log in as Owner
    await ownerPage.goto('/');
    await ownerPage.waitForLoadState('networkidle');
    await ownerPage.locator('input#login-email').click();
    await ownerPage.locator('input#login-email').fill(ownerEmail);
    await ownerPage.locator('input#login-password').click();
    await ownerPage.locator('input#login-password').fill(testPassword);
    
    loginPromise = ownerPage.waitForResponse(res => res.url().includes('/api/auth/callback/credentials'));
    await ownerPage.locator('form').filter({ has: ownerPage.locator('input#login-email') }).locator('button[type="submit"]').click();
    await loginPromise;

    // Ensure login finishes routing EXACTLY to dashboard
    await ownerPage.waitForURL('**/dashboard');
    await ownerPage.waitForSelector('h1:has-text("Dashboard Overview")');

    // Navigate to Activity Logs using Nuxt Router directly to avoid any UI or SSR race conditions
    await ownerPage.evaluate(() => {
      // @ts-ignore
      window.useNuxtApp().$router.push('/dashboard/activity');
    });
    await ownerPage.waitForURL('**/dashboard/activity', { timeout: 10000 });

    // Wait for network idle and brief pause
    await ownerPage.waitForTimeout(3000);

    // Let's see where we are!
    await ownerPage.screenshot({ path: 'tests/e2e/owner-debug.png' });
    const fullHtml = await ownerPage.content();
    console.log('FULL HTML:', fullHtml.substring(0, 500));
    
    // Assert 1: Good behavior is visible
    await expect(ownerPage.locator('tbody')).toContainText('Checkin Tenant');
    
    // Assert 2: Cheating attempt is visible
    await expect(ownerPage.locator('tbody')).toContainText('Unauthorized Attempt');
    await expect(ownerPage.locator('tbody')).toContainText('Operator attempted to perform an owner-only action');
    
    // Verify it's labeled under the malicious operator's name
    const cheatingRow = ownerPage.locator('tr', { hasText: 'Unauthorized Attempt' }).first();
    await expect(cheatingRow).toContainText('Malicious Operator');
    
    await ownerContext.close();
  });

});
