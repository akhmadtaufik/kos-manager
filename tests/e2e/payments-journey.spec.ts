import { test, expect } from '@playwright/test';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_MIGRATE_URL || 'postgres://postgres:password@localhost:5435/kosmanager');

const ownerEmail = `owner_pay_${Date.now()}@test.com`;
const testPassword = 'Password123!';
const tenantName = `Tenant Sinta ${Date.now()}`;

let ownerId: string;
let propertyId: string;
let roomId: string;
let tenantId: string;

test.describe.serial('Payments Module & Detailed Invoice Slide-over Journey', () => {
  test.setTimeout(120000);

  test.beforeAll(async ({ request }) => {
    // 1. Register Owner
    const res = await request.post('/api/auth/register', {
      data: { email: ownerEmail, password: testPassword, name: 'Juragan Kos', role: 'owner' }
    });
    expect(res.ok()).toBeTruthy();

    const ownerRows = await sql`SELECT id FROM users WHERE email = ${ownerEmail}`;
    ownerId = ownerRows[0]!.id;
    await sql`UPDATE users SET role = 'owner' WHERE id = ${ownerId}`;

    // 2. Create Property
    const propRes = await sql`
      INSERT INTO properties (user_id, name, address) 
      VALUES (${ownerId}, 'Kos Melati Harmoni', 'Jl. Melati No. 8') 
      RETURNING id
    `;
    propertyId = propRes[0]!.id;

    // 3. Create Room (monthly rate: Rp 1.500.000 + Additional Fee: Rp 150.000 WiFi)
    const roomRes = await sql`
      INSERT INTO rooms (property_id, room_number, monthly_rate, additional_fees) 
      VALUES (
        ${propertyId}, 
        '101', 
        1500000, 
        ${JSON.stringify([{ name: 'WiFi High-Speed', amount: 150000 }])}
      ) 
      RETURNING id
    `;
    roomId = roomRes[0]!.id;

    // 4. Create Tenant
    const tenantRes = await sql`
      INSERT INTO tenants (room_id, name, phone, check_in, is_active) 
      VALUES (${roomId}, ${tenantName}, '081987654321', NOW(), 1) 
      RETURNING id
    `;
    tenantId = tenantRes[0]!.id;
  });

  test.afterAll(async () => {
    await sql`DELETE FROM users WHERE email = ${ownerEmail}`;
    await sql.end();
  });

  test('Owner generates invoice, opens Slide-over panel, verifies breakdown of base rent + fees, and marks payment as paid via ConfirmModal', async ({ page }) => {
    // ---- Step 1: Owner Login ----
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('input#login-email').fill(ownerEmail);
    await page.locator('input#login-password').fill(testPassword);

    const loginPromise = page.waitForResponse(res => res.url().includes('/api/auth/callback/credentials'));
    await page.locator('form').filter({ has: page.locator('input#login-email') }).locator('button[type="submit"]').click();
    await loginPromise;

    await page.waitForURL('**/dashboard');

    // ---- Step 2: Navigate to Payments Page ----
    await page.goto('/payments');
    await page.waitForLoadState('networkidle');

    // Select the active property in the header dropdown if needed
    const propSelector = page.locator('#active-property-select');
    if (await propSelector.isVisible()) {
      await propSelector.selectOption(propertyId);
      await page.waitForTimeout(1000);
    }

    // ---- Step 3: Generate Invoice ----
    const genPromise = page.waitForResponse(res => res.url().includes('/api/payments/generate') && res.request().method() === 'POST');
    await page.locator('button#btn-generate-invoices').click();
    const genRes = await genPromise;
    expect(genRes.status()).toBe(200);

    // Verify Tenant and Aggregated Amount (1.500.000 + 150.000 = 1.650.000) appear in table
    const tableRow = page.locator('tr', { hasText: tenantName });
    await expect(tableRow).toBeVisible();
    await expect(tableRow).toContainText('1.650.000');
    await expect(tableRow).toContainText('Belum Lunas');

    // ---- Step 4: Verify 3 Summary Metric Cards ----
    await expect(page.locator('text=Total Tertagih')).toBeVisible();
    await expect(page.locator('text=Total Terbayar (Lunas)')).toBeVisible();
    await expect(page.locator('text=Sisa Piutang (Belum Lunas)')).toBeVisible();

    // ---- Step 5: Test Segmented Control Tabs ----
    // Tab "Lunas" should be empty initially
    await page.locator('button#tab-paid-payments').click();
    await expect(page.locator('body')).toContainText('Tidak ada data tagihan');

    // Tab "Belum Lunas" shows the unpaid invoice
    await page.locator('button#tab-unpaid-payments').click();
    await expect(tableRow).toBeVisible();

    // Tab "Semua" shows all
    await page.locator('button#tab-all-payments').click();
    await expect(tableRow).toBeVisible();

    // ---- Step 6: Open Detailed Invoice Slide-over Panel ----
    await tableRow.click();

    const slideOver = page.locator('#invoice-slideover-panel');
    await expect(slideOver).toBeVisible();
    await expect(slideOver).toContainText('Rincian Tagihan Sewa');
    await expect(slideOver).toContainText(tenantName);
    await expect(slideOver).toContainText('Kamar 101');

    // Assert Line Items breakdown: Base Rent + Additional Fee
    await expect(slideOver).toContainText('Biaya Sewa Dasar');
    await expect(slideOver).toContainText('1.500.000');
    await expect(slideOver).toContainText('Biaya Tambahan: WiFi High-Speed');
    await expect(slideOver).toContainText('150.000');
    await expect(slideOver).toContainText('1.650.000');

    // ---- Step 7: Mark as Paid from Inside Slide-over via ConfirmModal ----
    await slideOver.locator('#btn-slideover-mark-paid').click();

    // Confirm in custom ConfirmModal
    await expect(page.locator('h3:has-text("Konfirmasi Pelunasan")')).toBeVisible();
    const patchPromise = page.waitForResponse(res => res.url().includes('/api/payments/') && res.request().method() === 'PATCH');
    await page.locator('button:has-text("Ya, Tandai Lunas")').click();
    const patchRes = await patchPromise;
    expect(patchRes.status()).toBe(200);

    // Verify slide-over updates with verified timestamp
    await expect(slideOver).toContainText('Pembayaran Telah Diverifikasi');

    // Close Slide-over
    await slideOver.locator('#btn-close-slideover').click();
    await expect(slideOver).not.toBeVisible();

    // Verify Table Row reflects verified status
    await expect(tableRow).toContainText('Terverifikasi');

    // Verify Tab "Lunas" now contains the record
    await page.locator('button#tab-paid-payments').click();
    await expect(tableRow).toBeVisible();
  });
});
