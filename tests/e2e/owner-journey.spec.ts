import { test, expect } from '@playwright/test';

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
    // Automatically accept any alerts/dialogs that pop up (like success messages)
    page.on('dialog', dialog => dialog.accept());

    // 0. Setup: Register a new test user to ensure clean state
    await page.goto('/login');
    await page.click('#tab-register');
    await page.fill('#reg-name', userName);
    await page.fill('#reg-email', userEmail);
    await page.fill('#reg-password', userPassword);
    await page.click('#btn-register-submit');
    
    // Handle Onboarding flow
    await expect(page).toHaveURL(/.*onboarding/);
    await page.click('button:has-text("Pemilik Kos")');

    // Ensure we are redirected to the dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // 1. Create Property
    await page.locator('nav').locator('text=Properties').click();
    await page.fill('input[placeholder="e.g., Kos Eksekutif Sudirman"]', propertyName);
    await page.click('button:has-text("Create")');
    // Assert property appears in the list
    await expect(page.locator('table')).toContainText(propertyName);

    // Select the newly created property in the global switcher
    await page.locator('#property-switcher').selectOption({ label: propertyName });

    // 2. Create Room & Set Price
    await page.locator('nav').locator('text=Rooms').click();
    // Ensure we are not in Global View
    await expect(page.locator('h2:has-text("Add New Room")')).toBeVisible();
    await page.fill('input[placeholder="e.g., A101 or Mawar"]', roomNumber);
    await page.fill('input[placeholder="e.g., 1500000"]', baseMonthlyRate);
    await page.click('button:has-text("Create")');
    // Wait for the room to appear in the list
    await expect(page.locator('table')).toContainText(roomNumber);

    // 3. Add Additional Fees (Room Edit)
    // Find the row for the room and click "Edit"
    const roomRow = page.locator('tr', { hasText: roomNumber });
    await roomRow.locator('button:has-text("Edit")').click();
    
    // In the Edit Room modal
    await expect(page.locator('h2:has-text("Edit Room")')).toBeVisible();
    await page.click('button:has-text("Add Fee")');
    
    // Fill the fee details
    await page.fill('input[placeholder="Fee Name (e.g., WiFi)"]', 'WiFi Fee');
    await page.fill('input[placeholder="Amount (Rp)"]', additionalFeeAmount);
    
    // Save changes
    await page.click('button:has-text("Save Changes")');
    
    // Wait for the modal to close and table to update
    await expect(page.locator('h2:has-text("Edit Room")')).not.toBeVisible();

    // 4. Check-In Tenant (Tenant Creation)
    await page.locator('nav').locator('text=Tenants').click();
    await expect(page.locator('h2:has-text("Onboard New Tenant")')).toBeVisible();
    
    // Select Room
    await page.locator('select', { has: page.locator('option:has-text("Select Room")') }).selectOption({ label: roomNumber });
    
    // Fill Primary Info
    await page.locator('input[type="text"]').nth(0).fill(tenantName);
    await page.locator('input[type="text"]').nth(1).fill('081234567890');
    // Check-in date (set to today)
    const today = new Date().toISOString().split('T')[0];
    await page.locator('input[type="date"]').fill(today);
    
    // Cascading Dropdowns
    await page.locator('#province-select').selectOption({ label: 'Jawa Barat' });
    
    // Wait for Regency to enable and select one
    await expect(page.locator('#regency-select')).not.toBeDisabled();
    await page.locator('#regency-select').selectOption({ index: 1 });
    
    // Wait for District to enable and select one
    await expect(page.locator('#district-select')).not.toBeDisabled();
    await page.locator('#district-select').selectOption({ index: 1 });
    
    // Save Tenant
    await page.click('button:has-text("Onboard Tenant")');
    
    // Assert the tenant is active in the table
    const tenantRow = page.locator('tr', { hasText: tenantName });
    await expect(tenantRow).toBeVisible();
    await expect(tenantRow).toContainText('Active');

    // 5. Billing / Generate Invoice
    await page.locator('nav').locator('text=Payments').click();
    await page.click('button:has-text("Buat Tagihan Bulan Ini")');
    // Look for success message
    await expect(page.locator('.bg-emerald-50')).toBeVisible();
    
    // Assert the Aggregation: Verify total billed amount
    const paymentRow = page.locator('tr', { hasText: tenantName });
    await expect(paymentRow).toBeVisible();
    await expect(paymentRow).toContainText(totalBilled);

    // 6. Create Property Expense
    await page.locator('nav').locator('text=Expenses').click();
    await page.click('button:has-text("Catat Pengeluaran")');
    
    // In the form modal
    await expect(page.locator('h2:has-text("Catat Pengeluaran Baru")')).toBeVisible();
    await page.locator('.fixed input[type="date"]').fill(today);
    await page.locator('.fixed select').selectOption({ label: 'Perbaikan & Pemeliharaan' });
    await page.locator('.fixed input[type="number"]').fill('200000');
    await page.locator('textarea').fill(expenseDesc);
    
    await page.click('button:has-text("Simpan")');
    
    // Assert the expense appears in the table
    const expenseRow = page.locator('tr', { hasText: expenseDesc });
    await expect(expenseRow).toBeVisible();
    await expect(expenseRow).toContainText('200.000');
  });
});
