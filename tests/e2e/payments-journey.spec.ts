import { test, expect } from '@playwright/test';

test.describe.serial('Payments Module & Detailed Invoice Slide-over Journey', () => {
  test.setTimeout(180000);

  const timestamp = Date.now();
  const userName = `Owner Pay ${timestamp}`;
  const userEmail = `owner_pay_${timestamp}@test.com`;
  const userPassword = 'Password123!';
  const propertyName = `Kos Harmoni ${timestamp}`;
  const roomNumber = `R-${timestamp.toString().slice(-4)}`;
  const tenantName = `Tenant Sinta ${timestamp}`;
  const baseMonthlyRate = '1500000';
  const additionalFeeAmount = '150000';

  test('Owner generates invoice, opens Slide-over panel, verifies breakdown of base rent + fees, and marks payment as paid via ConfirmModal', async ({ page }) => {
    // ---- Step 1: Owner Register & Complete Onboarding ----
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

    // ---- Step 3: Create Room & Add WiFi Fee ----
    await page.locator('nav').locator('text=Rooms').click();
    await expect(page.locator('h1:has-text("Manajemen Kamar")')).toBeVisible();
    await page.click('#btn-add-room');
    const roomFormPanel = page.locator('#room-form-slideover-panel');
    await expect(roomFormPanel).toBeVisible();
    await roomFormPanel.locator('#input-room-number').fill(roomNumber);
    await roomFormPanel.locator('#input-room-rate').fill(baseMonthlyRate);

    // Add Additional Fee directly in the form
    await roomFormPanel.locator('#btn-add-fee').click();
    await roomFormPanel.locator('input[placeholder*="WiFi"]').fill('WiFi High-Speed');
    await roomFormPanel.locator('input[placeholder*="Amount"]').fill(additionalFeeAmount);
    await roomFormPanel.locator('#btn-submit-room-form').click();
    await expect(roomFormPanel).not.toBeVisible();
    await expect(page.locator('#rooms-grid')).toContainText(roomNumber);

    // ---- Step 4: Check-in Tenant ----
    await page.locator('nav').locator('text=Tenants').click();
    await expect(page.locator('h1:has-text("Direktori Penghuni")')).toBeVisible();

    await page.click('#btn-onboard-tenant');
    const tenantFormPanel = page.locator('#tenant-form-slideover-panel');
    await expect(tenantFormPanel).toBeVisible();

    await tenantFormPanel.locator('#select-room').selectOption({ index: 1 });
    await tenantFormPanel.locator('#input-tenant-name').fill(tenantName);
    await tenantFormPanel.locator('#input-tenant-phone').fill('081987654321');
    const today = new Date().toISOString().split('T')[0];
    await tenantFormPanel.locator('#input-tenant-checkin').fill(today as string);

    // Cascading Dropdowns
    await tenantFormPanel.locator('#province-select').selectOption({ label: 'JAWA BARAT' });
    await expect(tenantFormPanel.locator('#regency-select option')).toHaveCount(28, { timeout: 10000 });
    await tenantFormPanel.locator('#regency-select').selectOption({ index: 1 });
    await expect(tenantFormPanel.locator('#district-select option')).not.toHaveCount(1, { timeout: 10000 });
    await tenantFormPanel.locator('#district-select').selectOption({ index: 1 });

    await tenantFormPanel.locator('#btn-submit-tenant-form').click();
    await expect(tenantFormPanel).not.toBeVisible({ timeout: 10000 });

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

    // Verify Tenant and Aggregated Amount (1.500.000 + 150.000 = 1.650.000) appear in table
    const paymentRow = page.locator('tr', { hasText: tenantName });
    await expect(paymentRow).toBeVisible();
    await expect(paymentRow).toContainText('1.650.000');
    await expect(paymentRow).toContainText('Belum Lunas');

    // ---- Step 6: Verify 3 Summary Metric Cards ----
    await expect(page.locator('text=Total Tertagih')).toBeVisible();
    await expect(page.locator('text=Total Kas Diterima')).toBeVisible();
    await expect(page.locator('text=Sisa Piutang (Belum Masuk)')).toBeVisible();

    // ---- Step 7: Test Segmented Control Tabs ----
    // Tab "Lunas" should be empty initially
    await page.locator('button#tab-paid-payments').click();
    await expect(page.locator('body')).toContainText('Tidak ada data tagihan');

    // Tab "Belum Lunas" shows the unpaid invoice
    await page.locator('button#tab-unpaid-payments').click();
    await expect(paymentRow).toBeVisible();

    // Tab "Semua" shows all
    await page.locator('button#tab-all-payments').click();
    await expect(paymentRow).toBeVisible();

    // ---- Step 8: Open Detailed Invoice Slide-over Panel ----
    await paymentRow.click();

    const slideOver = page.locator('#invoice-slideover-panel');
    await expect(slideOver).toBeVisible();
    await expect(slideOver).toContainText('Rincian Tagihan Sewa');
    await expect(slideOver).toContainText(tenantName);

    // Assert Line Items breakdown: Base Rent + Additional Fee
    await expect(slideOver).toContainText('Biaya Sewa Dasar');
    await expect(slideOver).toContainText('1.500.000');
    await expect(slideOver).toContainText('Biaya Tambahan: WiFi High-Speed');
    await expect(slideOver).toContainText('150.000');
    await expect(slideOver).toContainText('1.650.000');

    // ---- Step 9: Mark as Paid from Inside Slide-over via ConfirmModal ----
    await slideOver.locator('#btn-slideover-mark-paid').click();

    // Confirm in custom ConfirmModal
    await expect(page.locator('h3:has-text("Konfirmasi Pelunasan Penuh")')).toBeVisible();
    const patchPromise = page.waitForResponse(res => res.url().includes('/api/payments/') && res.request().method() === 'PATCH');
    await page.locator('button:has-text("Ya, Lunasi Sekarang")').click();
    const patchRes = await patchPromise;
    expect(patchRes.status()).toBe(200);

    // Verify slide-over updates with verified timestamp
    await expect(slideOver).toContainText('Terverifikasi Lunas');

    // Close Slide-over
    await slideOver.locator('#btn-close-slideover').click();
    await expect(slideOver).not.toBeVisible();

    // Verify Table Row reflects verified status
    await expect(paymentRow).toContainText('Terverifikasi');

    // Verify Tab "Lunas" now contains the record
    await page.locator('button#tab-paid-payments').click();
    await expect(paymentRow).toBeVisible();
  });
});
