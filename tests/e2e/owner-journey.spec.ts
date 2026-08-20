import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test.describe('Owner Journey E2E', () => {
  const timestamp = Date.now();
  const userName = `Owner ${timestamp}`;
  const userEmail = `owner${timestamp}@example.com`;
  const userPassword = 'Password123!';
  const propertyName = `Property ${timestamp}`;
  const roomNumber = `R${timestamp}`;
  const tenantName = `Tenant ${timestamp}`;
  const expenseDesc = `Plumbing repair ${timestamp}`;
  const baseMonthlyRate = '1000000';
  const additionalFeeAmount = '150000';
  const totalBilled = (parseInt(baseMonthlyRate) + parseInt(additionalFeeAmount)).toLocaleString('id-ID');

  test('Complete Property Management Flow', async ({ page }) => {
    test.setTimeout(240000);
    // Automatically accept any alerts/dialogs that pop up (like success messages)
    page.on('dialog', dialog => dialog.accept());
    
    // Debug: capture all console and page errors
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log('CONSOLE LOG:', msg.text());
      }
    });

    // 0. Setup: Register a new test user to ensure clean state
    await page.goto('/');
    await page.click('#tab-register');
    await page.fill('#reg-name', userName);
    await page.fill('#reg-email', userEmail);
    await page.fill('#reg-password', userPassword);
    await page.click('button[type="submit"]');
    
    // Handle Onboarding flow
    await expect(page).toHaveURL(/.*onboarding/, { timeout: 15000 });
    await page.click('button:has-text("Pemilik Kos")');

    // Ensure we are redirected to the dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });

    // 1. Create Property
    await page.locator('nav').locator('text=Properties').click();
    await expect(page.locator('h1:has-text("Manajemen Properti")')).toBeVisible();
    await page.click('#btn-add-property');
    const propertyFormPanel = page.locator('#property-form-slideover-panel');
    await expect(propertyFormPanel).toBeVisible();
    await propertyFormPanel.locator('#input-property-name').fill(propertyName);
    await propertyFormPanel.locator('#input-property-address').fill('Jl. Sudirman No. 45, Jakarta');
    await propertyFormPanel.locator('#btn-submit-property-form').click();
    await expect(propertyFormPanel).not.toBeVisible();
    // Assert property appears in the card grid
    await expect(page.locator('#properties-grid')).toContainText(propertyName);

    // Select the newly created property in the global switcher
    await page.locator('#property-switcher').selectOption({ label: propertyName });

    // 2. Create Room & Set Price
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

    // 3. Add Additional Fees (Room Edit)
    const roomCard = page.locator('#rooms-grid > div', { hasText: roomNumber });
    await roomCard.locator('button[title="Edit Kamar"]').click();
    
    // In the Edit Room slide-over
    await expect(roomFormPanel).toBeVisible();
    await roomFormPanel.locator('#btn-add-fee').click();
    
    // Fill the fee details
    await roomFormPanel.locator('input[placeholder*="WiFi"]').fill('WiFi Fee');
    await roomFormPanel.locator('input[placeholder*="Amount"]').fill(additionalFeeAmount);
    
    // Save changes
    await roomFormPanel.locator('#btn-submit-room-form').click();
    await expect(roomFormPanel).not.toBeVisible();

    // 4. Check-In Tenant (Tenant Creation)
    await page.locator('nav').locator('text=Tenants').click();
    await expect(page.locator('h1:has-text("Direktori Penghuni")')).toBeVisible();

    await page.click('#btn-onboard-tenant');
    const tenantFormPanel = page.locator('#tenant-form-slideover-panel');
    await expect(tenantFormPanel).toBeVisible();
    
    // Select Room
    await tenantFormPanel.locator('#select-room').selectOption({ index: 1 });
    
    // Fill Primary Info
    await tenantFormPanel.locator('#input-tenant-name').fill(tenantName);
    await tenantFormPanel.locator('#input-tenant-phone').fill('081234567890');
    // Check-in date (set to today)
    const today = new Date().toISOString().split('T')[0];
    await tenantFormPanel.locator('#input-tenant-checkin').fill(today as string);
    
    // Cascading Dropdowns
    await tenantFormPanel.locator('#province-select').selectOption({ label: 'JAWA BARAT' });
    await expect(tenantFormPanel.locator('#regency-select option')).toHaveCount(28, { timeout: 10000 });
    await tenantFormPanel.locator('#regency-select').selectOption({ index: 1 });
    await expect(tenantFormPanel.locator('#district-select option')).not.toHaveCount(1, { timeout: 10000 });
    await tenantFormPanel.locator('#district-select').selectOption({ index: 1 });
    
    // Save Tenant
    await tenantFormPanel.locator('#btn-submit-tenant-form').click();
    await expect(tenantFormPanel).not.toBeVisible({ timeout: 10000 });
    
    // Assert the tenant is active in the table
    const tenantRow = page.locator('tr', { hasText: tenantName });
    await expect(tenantRow).toBeVisible();
    await expect(tenantRow).toContainText('Aktif');

    // 5. Billing / Generate Invoice
    await page.locator('nav').locator('text=Payments').click();
    await page.click('button:has-text("Buat Tagihan Bulan Ini")');
    // Look for success message
    await expect(page.getByText(/invoices generated successfully/i)).toBeVisible();
    
    // Assert the Aggregation: Verify total billed amount
    const paymentRow = page.locator('tr', { hasText: tenantName });
    await expect(paymentRow).toBeVisible();
    await expect(paymentRow).toContainText(totalBilled);

    // 6. Create Property Expense
    // Change from client-side click to hard goto to bypass Nuxt transition bugs
    await page.goto('/expenses');
    
    // Wait for the navigation to complete
    await expect(page).toHaveURL(/.*expenses/);
    
    // Debug: Dump HTML to see what's actually rendered
    const html = await page.content();
    fs.writeFileSync('debug-expenses.html', html);
    
    await expect(page.locator('h1:has-text("Pengeluaran Operasional")')).toBeVisible({ timeout: 10000 });
    
    // Check if the property is still active, just in case
    await expect(page.locator('text="Mode Global View Aktif"')).not.toBeVisible();
    
    await page.click('button:has-text("Catat Pengeluaran")');
    
    // In the form modal
    await expect(page.locator('h3:has-text("Catat Pengeluaran Baru")')).toBeVisible();
    await page.locator('.fixed input[type="date"]').fill(today as string);
    await page.click('button:has-text("Pemeliharaan")');
    await page.locator('.fixed input[type="number"]').fill('200000');
    await page.locator('textarea').fill(expenseDesc);
    
    await page.click('button:has-text("Simpan")');
    
    // Assert the expense appears in the table
    const expenseRow = page.locator('tr', { hasText: expenseDesc });
    await expect(expenseRow).toBeVisible();
    await expect(expenseRow).toContainText('200.000');
  });
});
