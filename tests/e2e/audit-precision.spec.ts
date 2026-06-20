import { test, expect } from '@playwright/test';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_MIGRATE_URL || 'postgres://postgres:Rnpl1105@localhost:5432/kosmanager_db');

const ownerEmail = `owner_precision_${Date.now()}@test.com`;
const operatorEmail = `op_precision_${Date.now()}@test.com`;
const testPassword = 'Password123!';

let ownerId: string;
let operatorId: string;
let propertyId: string;
let roomId: string;

test.describe.serial('Audit Data Precision Journey', () => {

  test.beforeAll(async ({ request }) => {
    // Register Owner
    let res = await request.post('/api/auth/register', {
      data: { email: ownerEmail, password: testPassword, name: 'Owner Precision', role: 'owner' }
    });
    expect(res.ok()).toBeTruthy();

    // Register Operator
    res = await request.post('/api/auth/register', {
      data: { email: operatorEmail, password: testPassword, name: 'Precision Operator', role: 'operator' }
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
      VALUES (${ownerId}, 'Precision Property', 'Data Lane') 
      RETURNING id
    `;
    propertyId = propRes[0].id;

    await sql`
      INSERT INTO user_properties (user_id, property_id, permissions) 
      VALUES (${operatorId}, ${propertyId}, '["manage_rooms"]'::jsonb)
    `;

    // Create Room with old base price
    const roomRes = await sql`
      INSERT INTO rooms (property_id, room_number, monthly_rate, status)
      VALUES (${propertyId}, 'P-101', 1000000, 'available')
      RETURNING id
    `;
    roomId = roomRes[0].id;
  });

  test.afterAll(async () => {
    await sql`DELETE FROM users WHERE email IN (${ownerEmail}, ${operatorEmail})`;
    await sql.end();
  });

  test('E2E Data Precision: Operator edits room, diff is logged', async ({ browser }) => {
    // --- PHASE 1: The Mutation ---
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

    // Trigger update via API directly to simulate form submission
    const updateRes = await opContext.request.patch(`/api/rooms/${roomId}`, {
      data: { roomNumber: 'P-101', monthlyRate: 1500000 }
    });
    if (!updateRes.ok()) console.error(await updateRes.text()); expect(updateRes.ok()).toBeTruthy();

    await opContext.close();

    // --- PHASE 2: The Verification ---
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

    // Assert the precision tracking
    const textContent = await ownerPage.locator('tbody').textContent();
    expect(textContent).toContain('1000000.00'); // the decimal format stored
    expect(textContent).toContain('➔');
    expect(textContent).toContain('1500000'); // or 1500000.00 if decimalized

    await ownerContext.close();
  });

});
