import { test, expect } from '@playwright/test';

test.describe.serial('Partial Payments & Accounting Ledger Journey', () => {
  test.setTimeout(180000);

  const timestamp = Date.now();
  const userName = `Owner Ledger ${timestamp}`;
  const userEmail = `owner_ledger_${timestamp}@test.com`;
  const userPassword = 'Password123!';
  const propertyName = `Kos Mandiri ${timestamp}`;
  const roomNumber = `R-${timestamp.toString().slice(-4)}`;
  const tenantName = `Tenant Cicilan ${timestamp}`;
  const baseMonthlyRate = '1500000';

  test('Complete Partial Payment Flow: Invoice Generation -> Partial Pay -> Sisa Calculation -> Timeline Ledger -> Overpay Block -> Full Settlement', async ({ page }) => {
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

    // Handle Onboarding
    await expect(page).toHaveURL(/.*onboarding/, { timeout: 15000 });
    await page.click('button:has-text("Pemilik Kos")');
    await expect(page).toHaveURL(/.*dashboard/);

    // ---- Step 2: Create Property & Select in Global Switcher ----
    await page.locator('nav').locator('text=Properties').click();
    await page.click('#btn-add-property');
    const propertyFormPanel = page.locator('#property-form-slideover-panel');
    await expect(propertyFormPanel).toBeVisible();
    await propertyFormPanel.locator('#input-property-name').fill(propertyName);
    await propertyFormPanel.locator('#btn-submit-property-form').click();
    await expect(propertyFormPanel).not.toBeVisible();
    await expect(page.locator('#properties-grid')).toContainText(propertyName);

    await page.locator('#property-switcher').selectOption({ label: propertyName });

    // ---- Step 3: Create Room (monthly rate: Rp 1.500.000) ----
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
    const today = new Date().toISOString().split('T')[0];
    await formPanel.locator('#input-tenant-checkin').fill(today as string);

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

    // ---- Step 5: Navigate to Payments & Generate Invoice ----
    await page.locator('nav').locator('text=Payments').click();
    await expect(page.locator('h1:has-text("Tagihan & Pembayaran")')).toBeVisible();

    const genPromise = page.waitForResponse(res => res.url().includes('/api/payments/generate') && res.request().method() === 'POST');
    await page.locator('button#btn-generate-invoices').click();
    const genRes = await genPromise;
    expect(genRes.status()).toBe(200);

    // Verify Tenant, Initial Paid (0) and Total (1.500.000) in Table
    const paymentRow = page.locator('tr', { hasText: tenantName });
    await expect(paymentRow).toBeVisible();
    await expect(paymentRow).toContainText('1.500.000');
    await expect(paymentRow).toContainText('Belum Lunas');

    // ---- Step 6: Open Slide-over & Record Partial Payment (Rp 1.000.000) ----
    await paymentRow.click();
    const slideOver = page.locator('#invoice-slideover-panel');
    await expect(slideOver).toBeVisible();
    await expect(slideOver).toContainText('Rincian Tagihan Sewa');
    await expect(slideOver).toContainText(tenantName);

    // Verify initial balance in slideover
    await expect(slideOver).toContainText('Sisa Tagihan');
    await expect(slideOver).toContainText('1.500.000');

    // Click "Bayar Sebagian"
    await slideOver.locator('#btn-slideover-partial-pay').click();

    // Fill partial payment form
    await page.locator('#input-partial-amount').fill('1000000');
    await page.locator('#input-partial-notes').fill('Cicilan 1 via Transfer BCA');

    const txnPromise1 = page.waitForResponse(res => res.url().includes('/transactions') && res.request().method() === 'POST');
    await page.locator('#btn-submit-partial-pay').click();
    const txnRes1 = await txnPromise1;
    expect(txnRes1.status()).toBe(200);

    // ---- Step 7: Assert Mathematical Balance & Partial Status ----
    // Status must transition to Bayar Sebagian (PARTIAL)
    await expect(slideOver).toContainText('Bayar Sebagian');
    // Amount paid: 1.000.000, Remaining: 500.000
    await expect(slideOver).toContainText('1.000.000');
    await expect(slideOver).toContainText('500.000');
    await expect(slideOver).toContainText('67% Terbayar');

    // Assert timeline renders the Rp 1.000.000 transaction entry
    await expect(slideOver).toContainText('Cicilan 1 via Transfer BCA');
    await expect(slideOver.getByText('Rp 1.000.000', { exact: true })).toBeVisible();

    // ---- Step 8: Overpayment Protection Test ----
    // Remaining is Rp 500.000. Attempt to pay Rp 800.000.
    await slideOver.locator('#btn-slideover-partial-pay').click();
    await page.locator('#input-partial-amount').fill('800000');
    
    // UI should show warning message and submit button should be disabled
    await expect(page.locator('text=Nominal melebihi sisa tagihan')).toBeVisible();
    await expect(page.locator('#btn-submit-partial-pay')).toBeDisabled();

    // Close modal
    await page.locator('#btn-cancel-partial-modal').click();

    // ---- Step 9: Pay Remaining Rp 500.000 -> Automatic Full Settlement ----
    await slideOver.locator('#btn-slideover-partial-pay').click();
    await page.locator('#input-partial-amount').fill('500000');
    await page.locator('#input-partial-notes').fill('Pelunasan Cicilan 2 via QRIS');

    const txnPromise2 = page.waitForResponse(res => res.url().includes('/transactions') && res.request().method() === 'POST');
    await page.locator('#btn-submit-partial-pay').click();
    const txnRes2 = await txnPromise2;
    expect(txnRes2.status()).toBe(200);

    // ---- Step 10: Assert Status Transition to Lunas (PAID) ----
    await expect(slideOver).toContainText('Lunas');
    await expect(slideOver).toContainText('100% Terbayar');
    await expect(slideOver).toContainText('Terverifikasi Lunas');

    // Both ledger entries must be visible in timeline
    await expect(slideOver).toContainText('Cicilan 1 via Transfer BCA');
    await expect(slideOver).toContainText('Pelunasan Cicilan 2 via QRIS');

    // Close slideover
    await slideOver.locator('#btn-close-slideover').click();
    await expect(slideOver).not.toBeVisible();

    // Table row reflects 1.500.000 / 1.500.000 and Terverifikasi
    await expect(paymentRow).toContainText('1.500.000 / Rp 1.500.000');
    await expect(paymentRow).toContainText('Terverifikasi');

    // Tab "Lunas" contains the record
    await page.locator('button#tab-paid-payments').click();
    await expect(paymentRow).toBeVisible();

    // Tab "Belum Lunas" is empty
    await page.locator('button#tab-unpaid-payments').click();
    await expect(page.locator('body')).toContainText('Tidak ada data tagihan');

    // Tab "Sebagian" is empty
    await page.locator('button#tab-partial-payments').click();
    await expect(page.locator('body')).toContainText('Tidak ada data tagihan');
  });
});
