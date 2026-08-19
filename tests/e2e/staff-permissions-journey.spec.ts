import { test, expect } from '@playwright/test';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_MIGRATE_URL || 'postgres://postgres:password@localhost:5435/kosmanager');

const ownerEmail = `owner_staff_${Date.now()}@test.com`;
const operatorEmail = `operator_staff_${Date.now()}@test.com`;
const testPassword = 'Password123!';

let ownerId: string;
let operatorId: string;
let propertyId: string;

test.describe.serial('Staff Management & Micro-Permissions Journey', () => {
  test.setTimeout(120000);

  test.beforeAll(async ({ request }) => {
    // 1. Register Owner
    let res = await request.post('/api/auth/register', {
      data: { email: ownerEmail, password: testPassword, name: 'Owner Bos', role: 'owner' }
    });
    expect(res.ok()).toBeTruthy();

    // 2. Register Operator
    res = await request.post('/api/auth/register', {
      data: { email: operatorEmail, password: testPassword, name: 'Operator Joni', role: 'operator' }
    });
    expect(res.ok()).toBeTruthy();

    // 3. Fetch IDs from DB to set up roles cleanly
    const ownerRows = await sql`SELECT id FROM users WHERE email = ${ownerEmail}`;
    ownerId = ownerRows[0]!.id;

    const opRows = await sql`SELECT id FROM users WHERE email = ${operatorEmail}`;
    operatorId = opRows[0]!.id;

    await sql`UPDATE users SET role = 'owner' WHERE id = ${ownerId}`;
    await sql`UPDATE users SET role = 'operator' WHERE id = ${operatorId}`;

    // 4. Create Property (as owner)
    const propRes = await sql`
      INSERT INTO properties (user_id, name, address) 
      VALUES (${ownerId}, 'Kost Eksklusif Melati', 'Jl. Melati No. 12') 
      RETURNING id
    `;
    propertyId = propRes[0]!.id;
  });

  test.afterAll(async () => {
    await sql`DELETE FROM users WHERE email IN (${ownerEmail}, ${operatorEmail})`;
    await sql.end();
  });

  test('Owner manages staff, configures micro-permissions via Toggle Switches & verifies RBAC', async ({ page }) => {
    // ---- Step 1: Owner Login ----
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('input#login-email').fill(ownerEmail);
    await page.locator('input#login-password').fill(testPassword);

    const loginPromise = page.waitForResponse(res => res.url().includes('/api/auth/callback/credentials'));
    await page.locator('form').filter({ has: page.locator('input#login-email') }).locator('button[type="submit"]').click();
    await loginPromise;

    await page.waitForURL('**/dashboard');

    // ---- Step 2: Navigate to Staff Page ----
    await page.goto('/staff');
    await page.waitForLoadState('networkidle');

    // Select the active property in the header dropdown
    const propSelector = page.locator('#active-property-select');
    if (await propSelector.isVisible()) {
      await propSelector.selectOption(propertyId);
      await page.waitForTimeout(1000);
    }

    // ---- Step 3: Hire Operator via Email ----
    await page.locator('input#operator-email-input').fill(operatorEmail);
    await page.locator('button#operator-submit-btn').click();

    // Verify operator appears in the table
    await expect(page.locator('body')).toContainText('Operator Joni');
    await expect(page.locator('body')).toContainText(operatorEmail);

    // ---- Step 4: Open Granular Micro-Permissions Modal ----
    await page.locator('button#btn-open-permissions').first().click();

    // Verify modal header and module sections are visible
    await expect(page.locator('h3')).toContainText('Hak Akses Mikro Operator');
    await expect(page.locator('body')).toContainText('Manajemen Kamar');
    await expect(page.locator('body')).toContainText('Manajemen Penghuni');
    await expect(page.locator('body')).toContainText('Tagihan & Pembayaran');
    await expect(page.locator('body')).toContainText('Manajemen Pengeluaran');

    // Verify animated toggle switches exist
    const roomCreateToggle = page.locator('button#toggle-rooms\\:create');
    await expect(roomCreateToggle).toBeVisible();

    // Toggle off rooms:delete
    const roomDeleteToggle = page.locator('button#toggle-rooms\\:delete');
    if (await roomDeleteToggle.getAttribute('aria-checked') === 'true') {
      await roomDeleteToggle.click();
      await expect(roomDeleteToggle).toHaveAttribute('aria-checked', 'false');
    }

    // Test Module Select All / Deselect All
    const toggleExpensesAll = page.locator('button#toggle-all-expenses');
    await toggleExpensesAll.click(); // Deselect all expenses
    await toggleExpensesAll.click(); // Re-select all expenses

    // ---- Step 5: Save Permissions ----
    const savePromise = page.waitForResponse(res => res.url().includes('/api/staff/') && res.request().method() === 'PATCH');
    await page.locator('button#btn-save-permissions').click();
    const saveRes = await savePromise;
    expect(saveRes.status()).toBe(200);

    // Modal should close
    await expect(page.locator('h3:has-text("Hak Akses Mikro Operator")')).not.toBeVisible();

    // Verify updated permissions in database
    const assignment = await sql`
      SELECT permissions FROM user_properties 
      WHERE user_id = ${operatorId} AND property_id = ${propertyId}
    `;
    const savedPerms = assignment[0]!.permissions as string[];
    expect(savedPerms).toContain('rooms:create');
    expect(savedPerms).not.toContain('rooms:delete');
  });
});
