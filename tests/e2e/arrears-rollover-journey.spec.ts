import { test, expect } from '@playwright/test';

test.describe.serial('Multi-Month Delinquency & Rollover Arrears Journey', () => {
  test.setTimeout(180000);

  const timestamp = Date.now();
  const userName = `Owner Arrears ${timestamp}`;
  const userEmail = `owner_arrears_${timestamp}@test.com`;
  const userPassword = 'Password123!';
  const propertyName = `Kos Arrears ${timestamp}`;
  const roomNumber = `R-${timestamp.toString().slice(-4)}`;
  const tenantName = `Tenant Tunggakan ${timestamp}`;
  const baseMonthlyRate = '1000000'; // 1.000.000 for easy math

  test('Arrears Rollover Flow: Seed Past Unpaid -> View Current Invoice -> Assert Arrears -> Distribute Payment', async ({ page }) => {
    // ---- Step 1: Register New Owner & Complete Onboarding ----
    await page.goto('/');
    
    await expect(async () => {
      await page.click('#tab-register');
      await expect(page.locator('#reg-name')).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15000 });

    await page.fill('#reg-name', userName);
    await page.fill('#reg-email', userEmail);
    await page.fill('#reg-password', userPassword);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*onboarding/, { timeout: 15000 });
    await page.click('button:has-text("Pemilik Kos")');
    await expect(page).toHaveURL(/.*dashboard/);

    // ---- Step 2: Create Property & Select ----
    await page.locator('nav').locator('text=Properties').click();
    await page.click('#btn-add-property');
    const propertyFormPanel = page.locator('#property-form-slideover-panel');
    await expect(propertyFormPanel).toBeVisible();
    await propertyFormPanel.locator('#input-property-name').fill(propertyName);
    await propertyFormPanel.locator('#btn-submit-property-form').click();
    await expect(propertyFormPanel).not.toBeVisible();
    await expect(page.locator('#properties-grid')).toContainText(propertyName);

    await page.locator('#property-switcher').selectOption({ label: propertyName });

    // ---- Step 3: Create Room (monthly rate: Rp 1.000.000) ----
    await page.locator('nav').locator('text=Rooms').click();
    await expect(page.locator('h1:has-text("Manajemen Kamar")')).toBeVisible();
    await page.click('#btn-add-room');
    const roomFormPanel = page.locator('#room-form-slideover-panel');
    await expect(roomFormPanel).toBeVisible();
    await roomFormPanel.locator('#input-room-number').fill(roomNumber);
    await roomFormPanel.locator('#input-room-rate').fill(baseMonthlyRate);
    await roomFormPanel.locator('#btn-submit-room-form').click();
    await expect(roomFormPanel).not.toBeVisible();
    await expect(page.locator('#rooms-grid')).toContainText(roomNumber);

    // ---- Step 4: Check-in Tenant ----
    await page.locator('nav').locator('text=Tenants').click();
    await expect(page.locator('h1:has-text("Direktori Penghuni")')).toBeVisible();

    await page.click('#btn-onboard-tenant');
    const formPanel = page.locator('#tenant-form-slideover-panel');
    await expect(formPanel).toBeVisible();

    await formPanel.locator('#select-room').selectOption({ index: 1 });
    await formPanel.locator('#input-tenant-name').fill(tenantName);
    await formPanel.locator('#input-tenant-phone').fill('081299887766');
    const todayStr = new Date().toISOString().split('T')[0];
    await formPanel.locator('#input-tenant-checkin').fill(todayStr as string);

    // Cascading dropdowns
    await formPanel.locator('#province-select').selectOption({ label: 'JAWA BARAT' });
    await expect(formPanel.locator('#regency-select option')).toHaveCount(28, { timeout: 10000 });
    await formPanel.locator('#regency-select').selectOption({ index: 1 });
    await expect(formPanel.locator('#district-select option')).not.toHaveCount(1, { timeout: 10000 });
    await formPanel.locator('#district-select').selectOption({ index: 1 });

    await formPanel.locator('#btn-submit-tenant-form').click();
    await expect(formPanel).not.toBeVisible({ timeout: 10000 });
    const tenantRow = page.locator('tr', { hasText: tenantName });
    await expect(tenantRow).toBeVisible();
    await expect(tenantRow).toContainText('Aktif');

    // ---- Step 5: Navigate to Payments (Current Month default) ----
    await page.locator('nav').locator('text=Payments').click();
    await expect(page.locator('h1:has-text("Tagihan & Pembayaran")')).toBeVisible();

    // ---- Step 6: Programmatically Generate Invoices for Previous and Current Month ----
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const previousMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

    // ---- Step 6: Navigate to Payments ----
    await page.locator('nav').locator('text=Payments').click();
    await expect(page.locator('h1:has-text("Tagihan & Pembayaran")')).toBeVisible();

    // Generate Previous Month Invoice
    await page.locator('#billing-month-select').fill(previousMonth);
    await page.locator('#billing-month-select').press('Tab'); // Trigger v-model update
    const genPromise1 = page.waitForResponse(res => res.url().includes('/api/payments/generate') && res.request().method() === 'POST');
    await page.locator('#btn-generate-invoices').click();
    const res1 = await genPromise1;
    expect(res1.status()).toBe(200);

    // Wait for the table to populate with the previous month invoice
    await expect(page.locator('tr', { hasText: tenantName })).toBeVisible();

    // Generate Current Month Invoice
    await page.locator('#billing-month-select').fill(currentMonth);
    await page.locator('#billing-month-select').press('Tab'); // Trigger v-model update
    const genPromise2 = page.waitForResponse(res => res.url().includes('/api/payments/generate') && res.request().method() === 'POST');
    await page.locator('#btn-generate-invoices').click();
    const res2 = await genPromise2;
    expect(res2.status()).toBe(200);

    // The table should display the current month's invoice
    const paymentRow = page.locator('tr', { hasText: tenantName });
    await expect(paymentRow).toBeVisible();

    
    // ---- Step 7: Open Slide-over & Assert Arrears Display ----
    await paymentRow.click();
    const slideOver = page.locator('#invoice-slideover-panel');
    await expect(slideOver).toBeVisible();
    
    // Should display Tunggakan from previous month (1.000.000)
    await expect(slideOver).toContainText('Tunggakan Bulan Sebelumnya');
    await expect(slideOver.locator('text=Rp 1.000.000').first()).toBeVisible();

    // Grand total should be 2.000.000 (1m current + 1m previous)
    await expect(slideOver).toContainText('Total Tagihan');
    await expect(slideOver.locator('span.text-lg.font-bold:has-text("Rp 2.000.000")')).toBeVisible();

    // ---- Step 8: Pay Partial (Rp 1.500.000) -> Should Distribute FIFO ----
    await slideOver.locator('#btn-slideover-partial-pay').click();
    await page.locator('#input-partial-amount').fill('1500000');
    await page.locator('#input-partial-notes').fill('Bayar tunggakan dan sebagian bulan ini');

    const txnPromise = page.waitForResponse(res => res.url().includes('/transactions') && res.request().method() === 'POST');
    await page.locator('#btn-submit-partial-pay').click();
    const txnRes = await txnPromise;
    expect(txnRes.status()).toBe(200);

    // Verify slide-over reflects the updated state
    await expect(slideOver).toContainText('Bayar Sebagian');
    // Sisa tagihan = 500.000
    await expect(slideOver.locator('.text-rose-600', { hasText: 'Rp 500.000' }).first()).toBeVisible();
    
    // Tunggakan should no longer be > 0
    await expect(slideOver.locator('text=Tunggakan Bulan Sebelumnya')).not.toBeVisible();

    // Total Tagihan is now just the current month's base (1.000.000)
    await expect(slideOver.locator('span.text-lg.font-bold:has-text("Rp 1.000.000")')).toBeVisible();

    // ---- Step 9: Verify the previous month is fully paid ----
    // Close slideover
    await slideOver.locator('#btn-close-slideover').click();
    
    // The UI has an input type="month" for v-model="selectedMonth"
    await page.locator('input[type="month"]').fill(previousMonth);
    
    // The table should update to previous month. It should show 'Terverifikasi' (Paid).
    await expect(paymentRow).toContainText('Terverifikasi');
  });
});
