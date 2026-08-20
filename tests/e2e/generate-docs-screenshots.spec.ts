import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Automated Visual Documentation Generator', () => {
  const timestamp = Date.now();
  const ownerName = `Owner Budi ${timestamp}`;
  const ownerEmail = `owner${timestamp}@kosmanager.com`;
  const ownerPassword = 'Password123!';
  const operatorEmail = `staff${timestamp}@kosmanager.com`;
  const propertyName = `Kos Sakura Melati ${timestamp}`;
  const roomNumber = '101';
  const tenantName = `Budi Santoso ${timestamp}`;
  const screenshotDir = path.resolve(process.cwd(), 'docs/screenshots');

  test('Generate All 10 Core Documentation Screenshots', async ({ page, request }) => {
    test.setTimeout(240000);

    // Ensure screenshot directory exists
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    // Configure viewport for high-DPI desktop view
    await page.setViewportSize({ width: 1440, height: 900 });

    // Accept any alert dialogs
    page.on('dialog', dialog => dialog.accept());

    // 1. Pre-register Operator account via API (so it exists in DB for staff assignment)
    await request.post('/api/auth/register', {
      data: {
        name: `Staff Operator ${timestamp}`,
        email: operatorEmail,
        password: ownerPassword,
        role: 'operator'
      }
    });

    // 2. Setup Owner Account via UI
    await page.goto('/');
    await page.click('#tab-register');
    await page.fill('#reg-name', ownerName);
    await page.fill('#reg-email', ownerEmail);
    await page.fill('#reg-password', ownerPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*onboarding/, { timeout: 15000 });
    await page.click('button:has-text("Pemilik Kos")');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });

    // 3. Create Property
    await page.locator('#sidebar-nav a[href="/properties"]').click();
    await expect(page.locator('h1').filter({ hasText: 'Properti' })).toBeVisible({ timeout: 15000 });
    await page.click('#btn-add-property');
    const propertyFormPanel = page.locator('#property-form-slideover-panel');
    await expect(propertyFormPanel).toBeVisible({ timeout: 10000 });
    await propertyFormPanel.locator('#input-property-name').fill(propertyName);
    await propertyFormPanel.locator('#input-property-address').fill('Jl. Margonda Raya No. 45, Depok, Jawa Barat');
    await propertyFormPanel.locator('#btn-submit-property-form').click();
    await expect(propertyFormPanel).not.toBeVisible();
    await expect(page.locator('#properties-grid')).toContainText(propertyName, { timeout: 10000 });

    // Select the property in global switcher
    await page.locator('#property-switcher').selectOption({ label: propertyName });

    // Capture 2: Properties Grid
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(screenshotDir, 'properties-grid.png'),
      fullPage: true
    });

    // 4. Create Room with Additional Fees
    await page.locator('#sidebar-nav a[href="/rooms"]').click();
    await expect(page.locator('h1').filter({ hasText: 'Kamar' })).toBeVisible({ timeout: 15000 });
    await page.click('#btn-add-room');
    const roomFormPanel = page.locator('#room-form-slideover-panel');
    await expect(roomFormPanel).toBeVisible({ timeout: 10000 });
    await roomFormPanel.locator('#input-room-number').fill(roomNumber);
    await roomFormPanel.locator('#input-room-rate').fill('1500000');
    
    // Add additional fee
    await roomFormPanel.locator('#btn-add-fee').click();
    await roomFormPanel.locator('input[placeholder*="Fee Name"]').first().fill('AC & Listrik Tambahan');
    await roomFormPanel.locator('input[placeholder*="Amount"]').first().fill('150000');
    
    await roomFormPanel.locator('#btn-submit-room-form').click();
    await expect(roomFormPanel).not.toBeVisible();
    await expect(page.locator('#rooms-grid')).toContainText(roomNumber, { timeout: 10000 });

    // Capture 3: Rooms Grid
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(screenshotDir, 'rooms-grid.png'),
      fullPage: true
    });

    // 5. Tenant Onboarding with Kemendagri Dropdowns
    await page.locator('#sidebar-nav a[href="/tenants"]').click();
    await expect(page.locator('h1').filter({ hasText: 'Penghuni' })).toBeVisible({ timeout: 15000 });
    await page.click('#btn-onboard-tenant, #btn-add-tenant');
    const tenantFormPanel = page.locator('#tenant-form-slideover-panel');
    await expect(tenantFormPanel).toBeVisible({ timeout: 10000 });
    await tenantFormPanel.locator('#select-room').selectOption({ index: 1 });
    await tenantFormPanel.locator('#input-tenant-name').fill(tenantName);
    await tenantFormPanel.locator('#input-tenant-phone').fill('081234567890');
    await tenantFormPanel.locator('#input-tenant-emergency').fill('Ibu Siti (081298765432)');
    await tenantFormPanel.locator('#input-tenant-checkin').fill('2026-08-01');

    // Select Kemendagri cascaded values
    await tenantFormPanel.locator('#province-select').selectOption({ label: 'DKI JAKARTA' });
    await page.waitForTimeout(600); // Allow reactivity to populate regencies
    await tenantFormPanel.locator('#regency-select').selectOption({ label: 'KOTA ADM. JAKARTA PUSAT' });
    await page.waitForTimeout(600); // Allow reactivity to populate districts
    await tenantFormPanel.locator('#district-select').selectOption({ label: 'GAMBIR' });

    // Capture 5: Tenant Onboarding Slide-over (Kemendagri Cascading Dropdowns)
    await page.screenshot({
      path: path.join(screenshotDir, 'tenant-onboarding-slideover.png')
    });

    // Submit tenant
    await tenantFormPanel.locator('#btn-submit-tenant-form').click();
    await expect(tenantFormPanel).not.toBeVisible();
    await expect(page.locator('#tenants-table, table')).toContainText(tenantName, { timeout: 10000 });

    // Capture 4: Tenant Directory
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(screenshotDir, 'tenant-directory.png'),
      fullPage: true
    });

    // 6. Generate Invoices & Payments Flow
    await page.locator('#sidebar-nav a[href="/payments"]').click();
    await expect(page.locator('h1').filter({ hasText: 'Tagihan' })).toBeVisible({ timeout: 15000 });
    await page.click('#btn-generate-invoices');
    await page.waitForTimeout(1500);
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10000 });

    // Capture 6: Payments Tabs & Financial Summary
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(screenshotDir, 'payments-tabs.png'),
      fullPage: true
    });

    // Open Invoice Slide-over
    await page.locator('table tbody tr').first().click();
    const invoiceSlideOver = page.locator('#invoice-slideover-panel');
    await expect(invoiceSlideOver).toBeVisible({ timeout: 10000 });

    // Capture 7: Invoice Slide-over
    await page.screenshot({
      path: path.join(screenshotDir, 'invoice-slideover.png')
    });

    // Close invoice slide-over
    await invoiceSlideOver.locator('#btn-close-slideover').click();
    await expect(invoiceSlideOver).not.toBeVisible();

    // 7. Expenses Flow
    await page.locator('#sidebar-nav a[href="/expenses"]').click();
    await expect(page.locator('h1').filter({ hasText: 'Pengeluaran' })).toBeVisible({ timeout: 15000 });
    await page.click('button:has-text("Catat")');
    const expenseModal = page.locator('div.fixed.inset-0:has-text("Catat Pengeluaran")');
    await expect(expenseModal).toBeVisible({ timeout: 10000 });
    await expenseModal.locator('button:has-text("Listrik & Daya")').click();
    await expenseModal.locator('input[type="number"]').fill('350000');
    await expenseModal.locator('textarea').fill('Token Listrik Utama (PLN)');
    await expenseModal.locator('button[type="submit"]:has-text("Simpan")').click();
    await expect(expenseModal).not.toBeVisible();

    // Capture 8: Expenses Filters & Cards
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(screenshotDir, 'expenses-filters.png'),
      fullPage: true
    });

    // 8. Staff Management & Micro-Permissions Modal
    await page.locator('#sidebar-nav a[href="/staff"]').click();
    await expect(page.locator('h1').filter({ hasText: 'Staf' })).toBeVisible({ timeout: 15000 });
    await page.fill('#operator-email-input', operatorEmail);
    await page.click('#operator-submit-btn');
    await page.waitForTimeout(1500);
    await expect(page.locator('table')).toContainText(operatorEmail, { timeout: 10000 });

    // Open Permissions Modal
    await page.click('#btn-open-permissions');
    const permissionModal = page.locator('div.fixed.inset-0:has-text("Hak Akses Mikro Operator") > div');
    await expect(permissionModal).toBeVisible({ timeout: 10000 });

    // Capture 9: Staff Micro-Permissions Modal
    await page.screenshot({
      path: path.join(screenshotDir, 'staff-micro-permissions.png')
    });

    // Close permission modal
    await page.click('#btn-close-modal');
    await expect(permissionModal).not.toBeVisible();

    // 9. Dashboard Global View (Captured after data population for rich chart & KPIs)
    await page.locator('#sidebar-nav a[href="/dashboard"]').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Capture 1: Dashboard Global View
    await page.screenshot({
      path: path.join(screenshotDir, 'dashboard-global-view.png'),
      fullPage: true
    });

    // 10. Activity Logs Timeline
    await page.goto('/dashboard/activity');
    await expect(page.locator('h1').filter({ hasText: 'Audit Trail' })).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1500);

    // Capture 10: Activity Logs Timeline
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(screenshotDir, 'activity-logs-timeline.png'),
      fullPage: true
    });
  });
});
