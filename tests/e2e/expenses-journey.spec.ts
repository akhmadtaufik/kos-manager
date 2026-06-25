import { test, expect } from '@playwright/test';

test.describe('Expenses Module UI/UX Journey', () => {
  const timestamp = Date.now();
  const userName = `Owner Exp ${timestamp}`;
  const userEmail = `owner_exp${timestamp}@example.com`;
  const userPassword = 'Password123!';
  const propertyName = `Property Exp ${timestamp}`;

  test('Expenses Redesign E2E Flows', async ({ page }) => {
    test.setTimeout(120000);
    // Automatically accept any alerts/dialogs (like confirmation dialog for deletion)
    page.on('dialog', dialog => dialog.accept());

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
    await expect(page).toHaveURL(/.*dashboard/);

    // 1. Create Property
    await page.locator('nav').locator('text=Properties').click();
    await page.fill('input[placeholder="e.g., Kos Eksekutif Sudirman"]', propertyName);
    await page.click('button:has-text("Create")');
    await expect(page.locator('table')).toContainText(propertyName);

    // Select the newly created property in the global switcher
    await page.locator('#property-switcher').selectOption({ label: propertyName });

    // Navigate to Expenses
    await page.locator('nav').locator('text=Expenses').click();
    await expect(page.locator('h1:has-text("Pengeluaran Operasional")')).toBeVisible();

    // ----------------------------------------------------
    // Scenario 1: Predefined Category
    // ----------------------------------------------------
    await page.click('button:has-text("Catat Pengeluaran")');
    await expect(page.locator('h3:has-text("Catat Pengeluaran Baru")')).toBeVisible();
    
    // Fill form
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[type="date"]', today);
    // Click 'Air' category
    await page.click('button:has-text("Air")');
    await page.fill('input[type="number"]', '50000');
    await page.fill('textarea', 'Tagihan PDAM');
    
    // Submit
    await page.click('button:has-text("Simpan")');

    // Assert Toast notification (Success)
    await expect(page.locator('text="Berhasil"').first()).toBeVisible({ timeout: 5000 });
    
    // Assert table row
    await expect(page.locator('table')).toContainText('Tagihan PDAM');
    await expect(page.locator('table')).toContainText('50.000');

    // ----------------------------------------------------
    // Scenario 2: Custom Category ("Lainnya")
    // ----------------------------------------------------
    await page.click('button:has-text("Catat Pengeluaran")');
    await expect(page.locator('h3:has-text("Catat Pengeluaran Baru")')).toBeVisible();
    
    await page.fill('input[type="date"]', today);
    // Click 'Lainnya'
    await page.click('button:has-text("Lainnya")');
    
    // Fill custom category input
    await page.fill('input[placeholder="Ketik nama kategori..."]', 'Biaya Keamanan Desa');
    
    await page.fill('input[type="number"]', '150000');
    await page.fill('textarea', 'Iuran bulanan RT/RW');
    
    // Submit
    await page.click('button:has-text("Simpan")');
    
    // Assert Toast
    await expect(page.locator('text="Berhasil"').first()).toBeVisible({ timeout: 5000 });

    // Assert table row
    await expect(page.locator('table')).toContainText('Biaya Keamanan Desa');
    await expect(page.locator('table')).toContainText('150.000');
    await expect(page.locator('table')).toContainText('Iuran bulanan RT/RW');

    // ----------------------------------------------------
    // Scenario 3: Deletion & Toast Validation
    // ----------------------------------------------------
    // Click delete on the custom expense row.
    const rowToDelete = page.locator('tr', { hasText: 'Biaya Keamanan Desa' });
    await rowToDelete.locator('button[title="Hapus Pengeluaran"]').click();
    
    // Wait for the deletion success toast.
    await expect(page.locator('text="Dihapus"').first()).toBeVisible({ timeout: 5000 });
    
    // Assert item is no longer in the DOM
    await expect(page.locator('table')).not.toContainText('Biaya Keamanan Desa');
  });
});
