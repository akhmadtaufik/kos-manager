import { test, expect } from '@playwright/test';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_MIGRATE_URL || 'postgres://postgres:Rnpl1105@localhost:5432/kosmanager_db');

const ownerEmail = `owner_tamper_${Date.now()}@test.com`;
const operatorEmail = `operator_tamper_${Date.now()}@test.com`;
const testPassword = 'Password123!';

let ownerId: string;
let operatorId: string;
let propertyId: string;
let targetLogId: string;

test.describe.serial('Audit Tamper Journey', () => {

  test.beforeAll(async ({ request }) => {
    // Register Owner
    let res = await request.post('/api/auth/register', {
      data: { email: ownerEmail, password: testPassword, name: 'Owner Secure', role: 'owner' }
    });
    expect(res.ok()).toBeTruthy();

    // Register Operator
    res = await request.post('/api/auth/register', {
      data: { email: operatorEmail, password: testPassword, name: 'Rogue Operator', role: 'operator' }
    });
    expect(res.ok()).toBeTruthy();

    // Get DB IDs
    const ownerRows = await sql`SELECT id FROM users WHERE email = ${ownerEmail}`;
    ownerId = ownerRows[0].id;

    const opRows = await sql`SELECT id FROM users WHERE email = ${operatorEmail}`;
    operatorId = opRows[0].id;

    await sql`UPDATE users SET role = 'owner' WHERE id = ${ownerId}`;
    await sql`UPDATE users SET role = 'operator' WHERE id = ${operatorId}`;

    // Create Property and Bind Operator
    const propRes = await sql`
      INSERT INTO properties (user_id, name, address) 
      VALUES (${ownerId}, 'Tamper Test Property', '123 Secure Lane') 
      RETURNING id
    `;
    propertyId = propRes[0].id;

    await sql`
      INSERT INTO user_properties (user_id, property_id, permissions) 
      VALUES (${operatorId}, ${propertyId}, '["manage_tenants"]'::jsonb)
    `;

    // Add a normal log that the operator will try to delete
    const logRes = await sql`
      INSERT INTO activity_logs (user_id, actor_name, actor_role, action, entity_type, details)
      VALUES (${operatorId}, 'Rogue Operator', 'operator', 'CREATE_TENANT', 'tenant', '{"name": "Sneaky Tenant"}'::jsonb)
      RETURNING id
    `;
    targetLogId = logRes[0].id;
  });

  test.afterAll(async () => {
    await sql`DELETE FROM users WHERE email IN (${ownerEmail}, ${operatorEmail})`;
    await sql.end();
  });

  test('E2E Audit Tampering: Operator tries to delete a log and is caught', async ({ browser }) => {
    // --- PHASE 1: The Hack ---
    const opContext = await browser.newContext();
    const opPage = await opContext.newPage();

    // Log in as Operator
    await opPage.goto('/');
    await opPage.waitForLoadState('networkidle');
    await opPage.locator('input#login-email').fill(operatorEmail);
    await opPage.locator('input#login-password').fill(testPassword);
    
    let loginPromise = opPage.waitForResponse(res => res.url().includes('/api/auth/callback/credentials'));
    await opPage.locator('form').filter({ has: opPage.locator('input#login-email') }).locator('button[type="submit"]').click();
    await loginPromise;
    await opPage.waitForURL('**/dashboard');

    // Send a direct DELETE request bypassing the UI
    const deleteRes = await opContext.request.delete(`/api/audit/${targetLogId}`);
    
    // --- PHASE 2: The Rejection ---
    expect(deleteRes.status()).toBe(403);
    const deleteJson = await deleteRes.json();
    expect(deleteJson).toMatchObject({
      status: 'error',
      statusCode: 403,
      message: expect.any(String)
    });
    
    // Send a direct PATCH request
    const patchRes = await opContext.request.patch(`/api/audit/${targetLogId}`, {
      data: { details: '{"name": "Good Tenant"}' }
    });
    expect(patchRes.status()).toBe(403);
    const patchJson = await patchRes.json();
    expect(patchJson).toMatchObject({
      status: 'error',
      statusCode: 403,
      message: expect.any(String)
    });

    await opContext.close();

    // --- PHASE 3: The Exposure ---
    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();

    // Log in as Owner
    await ownerPage.goto('/');
    await ownerPage.waitForLoadState('networkidle');
    await ownerPage.locator('input#login-email').fill(ownerEmail);
    await ownerPage.locator('input#login-password').fill(testPassword);
    
    loginPromise = ownerPage.waitForResponse(res => res.url().includes('/api/auth/callback/credentials'));
    await ownerPage.locator('form').filter({ has: ownerPage.locator('input#login-email') }).locator('button[type="submit"]').click();
    await loginPromise;
    await ownerPage.waitForURL('**/dashboard');

    await ownerPage.evaluate(() => {
      // @ts-ignore
      window.useNuxtApp().$router.push('/dashboard/activity');
    });
    await ownerPage.waitForURL('**/dashboard/activity', { timeout: 10000 });
    await ownerPage.waitForTimeout(3000); // Wait for data load

    // Verify the tamper attempts were caught and logged under the rogue operator's name
    const textContent = await ownerPage.locator('tbody').textContent();
    expect(textContent).toContain('Tamper Attempt');
    expect(textContent).toContain('Operator attempted to delete/modify audit logs');
    expect(textContent).toContain('Rogue Operator');

    await ownerContext.close();
  });

});
