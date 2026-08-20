import { test, expect } from '@playwright/test';

test.describe('Dashboard Analytics & MoM Time-Series Journey', () => {
  const timestamp = Date.now();
  const userName = `Analytics Owner ${timestamp}`;
  const userEmail = `analytics_owner_${timestamp}@example.com`;
  const userPassword = 'Password123!';
  const propertyName = `Kos Analytics ${timestamp}`;
  const roomNumber = `A${timestamp.toString().slice(-3)}`;
  const tenantName = `Budi Santoso ${timestamp.toString().slice(-3)}`;
  const tenantPhone = '081234567890';
  const emergencyContact = '089876543210';

  test('Full Dashboard Flow: Dynamic MoM Deltas, 6-Month Trend, Kemendagri Demographics & Action Needed Widget', async ({ page }) => {
    test.setTimeout(240000);
    page.on('dialog', dialog => dialog.accept());

    // 1. Setup: Register a new owner user
    console.log('[STEP 1] Registering new owner user');
    await page.goto('/');
    await page.click('#tab-register');
    await page.fill('#reg-name', userName);
    await page.fill('#reg-email', userEmail);
    await page.fill('#reg-password', userPassword);
    await page.click('button[type="submit"]');

    // Handle Onboarding flow
    await expect(page).toHaveURL(/.*onboarding/, { timeout: 15000 });
    await page.click('button:has-text("Pemilik Kos")');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });

    // 2. Create Property
    console.log('[STEP 2] Creating property');
    await page.locator('nav').locator('text=Properties').click();
    await expect(page.locator('h1:has-text("Manajemen Properti")')).toBeVisible();
    await page.click('#btn-add-property');
    const propertyFormPanel = page.locator('#property-form-slideover-panel');
    await expect(propertyFormPanel).toBeVisible();
    await propertyFormPanel.locator('#input-property-name').fill(propertyName);
    await propertyFormPanel.locator('#input-property-address').fill('Jl. M.H. Thamrin No. 1, Jakarta Pusat');
    await propertyFormPanel.locator('#btn-submit-property-form').click();
    await expect(propertyFormPanel).not.toBeVisible();
    await expect(page.locator('#properties-grid')).toContainText(propertyName);

    // Select the property in global switcher
    console.log('[STEP 2b] Selecting property in switcher');
    await page.locator('#property-switcher').selectOption({ label: propertyName });

    // 3. Create Room (Rate: Rp 2.000.000)
    console.log('[STEP 3] Creating room');
    await page.locator('nav').locator('text=Rooms').click();
    await expect(page.locator('h1:has-text("Manajemen Kamar")')).toBeVisible();
    await page.click('#btn-add-room');
    const roomFormPanel = page.locator('#room-form-slideover-panel');
    await expect(roomFormPanel).toBeVisible();
    await roomFormPanel.locator('#input-room-number').fill(roomNumber);
    await roomFormPanel.locator('#input-room-rate').fill('2000000');
    await roomFormPanel.locator('#btn-submit-room-form').click();
    await expect(roomFormPanel).not.toBeVisible();
    await expect(page.locator('#rooms-grid')).toContainText(roomNumber);

    // 4. Onboard Tenant with Kemendagri cascading location
    console.log('[STEP 4] Onboarding tenant with Kemendagri location');
    await page.locator('nav').locator('text=Tenants').click();
    await expect(page.locator('h1:has-text("Direktori Penghuni")')).toBeVisible();
    await page.click('#btn-onboard-tenant');
    const tenantFormPanel = page.locator('#tenant-form-slideover-panel');
    await expect(tenantFormPanel).toBeVisible();

    await tenantFormPanel.locator('#select-room').selectOption({ index: 1 });
    await tenantFormPanel.locator('#input-tenant-name').fill(tenantName);
    await tenantFormPanel.locator('#input-tenant-phone').fill(tenantPhone);
    await tenantFormPanel.locator('#input-tenant-emergency').fill(emergencyContact);
    await tenantFormPanel.locator('#input-tenant-checkin').fill('2026-06-01');

    // Kemendagri Cascade: Select DKI Jakarta -> Kota Adm. Jakarta Pusat -> Gambir
    await tenantFormPanel.locator('#province-select').selectOption({ label: 'DKI JAKARTA' });
    await expect(tenantFormPanel.locator('#regency-select option')).toHaveCount(7, { timeout: 10000 });
    await tenantFormPanel.locator('#regency-select').selectOption({ label: 'KOTA ADM. JAKARTA PUSAT' });
    await expect(tenantFormPanel.locator('#district-select option')).toHaveCount(9, { timeout: 10000 });
    await tenantFormPanel.locator('#district-select').selectOption({ label: 'GAMBIR' });

    await tenantFormPanel.locator('#btn-submit-tenant-form').click();
    await expect(tenantFormPanel).not.toBeVisible();
    await expect(page.locator('tr', { hasText: tenantName })).toBeVisible();

    // 5. Generate and Pay invoice for previous month (2026-07)
    console.log('[STEP 5] Navigating to Payments and generating 2026-07 invoice');
    await page.locator('nav').locator('text=Payments').click();
    await expect(page.locator('h1:has-text("Tagihan & Pembayaran")')).toBeVisible();
    
    // Set billing month to 2026-07 and generate
    await page.fill('#billing-month-select', '2026-07');
    const genPromise1 = page.waitForResponse(res => res.url().includes('/api/payments/generate') && res.request().method() === 'POST');
    await page.click('#btn-generate-invoices');
    await genPromise1;

    // Record full payment for 2026-07 invoice if available
    console.log('[STEP 5b] Marking 2026-07 invoice as paid');
    const paymentRow = page.locator('tr', { hasText: tenantName });
    await expect(paymentRow).toBeVisible();
    await paymentRow.click();
    const invoiceSlideOver = page.locator('#invoice-slideover-panel');
    await expect(invoiceSlideOver).toBeVisible();
    await invoiceSlideOver.locator('#btn-slideover-mark-paid').click();
    await expect(page.locator('h3:has-text("Konfirmasi Pelunasan Penuh")')).toBeVisible();
    const patchPromise = page.waitForResponse(res => res.url().includes('/api/payments/') && res.request().method() === 'PATCH');
    await page.locator('button:has-text("Ya, Lunasi Sekarang")').click();
    await patchPromise;
    await expect(invoiceSlideOver).toContainText('Terverifikasi Lunas');
    await invoiceSlideOver.locator('#btn-close-slideover').click();
    await expect(invoiceSlideOver).not.toBeVisible();

    // 6. Generate invoice for current month (2026-08) and leave unpaid
    console.log('[STEP 6] Generating 2026-08 invoice (unpaid)');
    await page.fill('#billing-month-select', '2026-08');
    const genPromise2 = page.waitForResponse(res => res.url().includes('/api/payments/generate') && res.request().method() === 'POST');
    await page.click('#btn-generate-invoices');
    await genPromise2;

    // 7. Record an Expense for 2026-08
    console.log('[STEP 7] Recording expense for 2026-08');
    await page.locator('nav').locator('text=Expenses').click();
    await expect(page.locator('h1:has-text("Pengeluaran Operasional")')).toBeVisible();
    await page.click('button:has-text("Catat Pengeluaran")');
    await expect(page.locator('h3:has-text("Catat Pengeluaran Baru")')).toBeVisible();
    await page.click('button:has-text("Listrik & Daya (PLN)")');
    await page.fill('input[type="date"]', '2026-08-15');
    await page.fill('input[type="number"]', '500000');
    await page.fill('textarea', 'Beli Token Listrik Utama');
    await page.click('button:has-text("Simpan Pengeluaran")');
    await expect(page.locator('text="Berhasil"').first()).toBeVisible({ timeout: 5000 });

    // 8. Navigate to Dashboard and verify complete analytics suite
    console.log('[STEP] Navigating to Dashboard');
    await page.locator('nav').locator('text=Dashboard').click();
    await expect(page.locator('h1:has-text("Dashboard Overview")')).toBeVisible();

    // Set Dashboard month filter to 2026-08
    console.log('[STEP] Setting month filter to 2026-08');
    await page.fill('#dashboard-month-filter', '2026-08');
    await page.waitForTimeout(1000);

    // Assert: Top 4 KPI Summary Cards
    console.log('[STEP] Asserting summary cards');
    const summaryCards = page.locator('#dashboard-summary-cards');
    await expect(summaryCards).toContainText('1'); // 1 unit total room
    await expect(summaryCards).toContainText('100%'); // 100% occupancy
    await expect(summaryCards).toContainText('500.000'); // 500k expenses
    await expect(page.locator('#mom-occupancy-rate')).toBeVisible();
    await expect(page.locator('#mom-expenses')).toBeVisible();
    await expect(page.locator('#mom-revenue')).toBeVisible();

    // Assert: Financial Overview (P&L Card)
    console.log('[STEP] Asserting Financial Overview (P&L)');
    await expect(page.locator('h2:has-text("Financial Overview (P&L)")')).toBeVisible();
    await expect(page.locator('#net-profit-badge')).toBeVisible();
    await expect(page.locator('#pnl-trend-sparklines')).toBeVisible();

    // Assert: "Perlu Perhatian" (Action Needed Widget)
    console.log('[STEP] Asserting Action Needed widget');
    const actionNeededWidget = page.locator('#dashboard-action-needed-widget');
    await expect(actionNeededWidget).toBeVisible();
    await expect(actionNeededWidget).toContainText(tenantName);
    await expect(actionNeededWidget).toContainText('Kamar ' + roomNumber);
    await expect(actionNeededWidget).toContainText('2.000.000');
    await expect(actionNeededWidget.locator('button:has-text("Catat Bayar")')).toBeVisible();

    // Assert: Demographics Card with Kemendagri Standard
    console.log('[STEP] Asserting Kemendagri demographics');
    const demoCard = page.locator('#dashboard-demographics-card');
    await expect(demoCard).toBeVisible();
    await expect(demoCard).toContainText('KOTA');
    await expect(demoCard).toContainText('KOTA ADM. JAKARTA PUSAT');
    await expect(demoCard).toContainText('1 (100%)');

    // Test Demographic Granularity Toggle (Switch to Provinsi)
    console.log('[STEP] Toggling demographics to Provinsi');
    await demoCard.locator('button:has-text("Provinsi")').click();
    await page.waitForTimeout(500);
    await expect(demoCard).toContainText('DKI JAKARTA');
    await expect(demoCard).toContainText('1 (100%)');
    console.log('[STEP] All assertions completed successfully!');
  });
});
