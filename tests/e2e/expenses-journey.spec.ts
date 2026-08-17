import { test, expect } from '@playwright/test';

test.describe('Expenses Module & Dynamic Icon Categories Journey', () => {
  const timestamp = Date.now();
  const userName = `Owner Exp ${timestamp}`;
  const userEmail = `owner_exp${timestamp}@example.com`;
  const userPassword = 'Password123!';
  const propertyName = `Property Exp ${timestamp}`;

  test('Comprehensive Expenses Flow: 9 Defaults, Icon Picker Dialog, Custom Categories, & Deletion', async ({ page }) => {
    test.setTimeout(120000);
    // Automatically accept any alerts/dialogs (like confirmation dialog for deletion)
    page.on('dialog', dialog => dialog.accept());

    // 0. Register new test user & complete onboarding
    await page.goto('/');
    
    // Fix hydration race condition by retrying the click until the input appears
    await expect(async () => {
      await page.click('#tab-register');
      await expect(page.locator('#reg-name')).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15000 });
    
    await page.fill('#reg-name', userName);
    await page.fill('#reg-email', userEmail);
    await page.fill('#reg-password', userPassword);
    await page.click('button[type="submit"]');
    
    // Handle Onboarding flow
    await expect(page).toHaveURL(/.*onboarding/, { timeout: 15000 });
    await page.click('button:has-text("Pemilik Kos")');

    // Ensure redirected to dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // 1. Create Property
    await page.locator('nav').locator('text=Properties').click();
    await page.fill('input[placeholder="e.g., Kos Eksekutif Sudirman"]', propertyName);
    await page.click('button:has-text("Create")');
    await expect(page.locator('table')).toContainText(propertyName);

    // Select the newly created property in the global switcher
    await page.locator('#property-switcher').selectOption({ label: propertyName });

    // Navigate to Expenses page
    await page.locator('nav').locator('text=Expenses').click();
    await expect(page.locator('h1:has-text("Pengeluaran Operasional")')).toBeVisible();

    // ----------------------------------------------------
    // Scenario 1: Verify 9 Professional Default Categories & Record Expense
    // ----------------------------------------------------
    await page.click('button:has-text("Catat Pengeluaran")');
    await expect(page.locator('h3:has-text("Catat Pengeluaran Baru")')).toBeVisible();
    
    // Verify default professional categories are rendered in grid
    await expect(page.locator('button:has-text("Listrik & Daya (PLN)")')).toBeVisible();
    await expect(page.locator('button:has-text("Air Bersih & Sanitasi (PDAM)")')).toBeVisible();
    await expect(page.locator('button:has-text("Kebersihan & Iuran Sampah")')).toBeVisible();
    await expect(page.locator('button:has-text("Gaji & Honor Karyawan")')).toBeVisible();
    await expect(page.locator('button:has-text("Pajak Bumi & Bangunan (PBB)")')).toBeVisible();
    await expect(page.locator('button:has-text("Zakat & Infaq Usaha")')).toBeVisible();
    await expect(page.locator('button:has-text("Santunan & Donasi Sosial")')).toBeVisible();
    await expect(page.locator('button:has-text("Pemeliharaan & Renovasi")')).toBeVisible();
    await expect(page.locator('button:has-text("Komisi & Marketing Agen")')).toBeVisible();

    // Select 'Air Bersih & Sanitasi (PDAM)'
    await page.click('button:has-text("Air Bersih & Sanitasi (PDAM)")');

    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[type="date"]', today as string);
    await page.fill('input[type="number"]', '75000');
    await page.fill('textarea', 'Pembayaran PDAM Bulan Ini');
    
    // Submit
    await page.click('button:has-text("Simpan Pengeluaran")');

    // Assert Toast notification (Success)
    await expect(page.locator('text="Berhasil"').first()).toBeVisible({ timeout: 5000 });
    
    // Assert table row with category name and amount
    await expect(page.locator('table')).toContainText('Air Bersih & Sanitasi (PDAM)');
    await expect(page.locator('table')).toContainText('75.000');
    await expect(page.locator('table')).toContainText('Pembayaran PDAM Bulan Ini');

    // ----------------------------------------------------
    // Scenario 2: Create Custom Category via Icon Picker Dialog (Modal Swapping)
    // ----------------------------------------------------
    await page.click('button:has-text("Catat Pengeluaran")');
    await expect(page.locator('h3:has-text("Catat Pengeluaran Baru")')).toBeVisible();
    
    // Click "+ Kategori Baru" to open Icon Picker dialog
    await page.click('button:has-text("+ Kategori Baru")');
    
    // VERIFY ELEGANT SWAPPING: Main form must disappear, Category form must appear
    await expect(page.locator('h3:has-text("Catat Pengeluaran Baru")')).not.toBeVisible();
    await expect(page.locator('h4:has-text("Buat Kategori Pengeluaran Baru")')).toBeVisible();

    // Fill category name & icon
    const customCategoryTitle = 'Langganan CCTV Cloud';
    await page.fill('input[placeholder="Contoh: Langganan CCTV, Servis Pompa..."]', customCategoryTitle);
    
    // Pick CCTV icon
    await page.locator('button[title="CCTV"]').click();

    // Verify live preview card updates with name
    await expect(page.locator('text="Tampilan Kategori"')).toBeVisible();
    await expect(page.locator('text="Langganan CCTV Cloud"')).toBeVisible();

    // Submit custom category creation
    await page.click('button:has-text("Simpan Kategori")');

    // VERIFY ELEGANT RETURN: Category form must disappear, Main form must RETURN automatically
    await expect(page.locator('h4:has-text("Buat Kategori Pengeluaran Baru")')).not.toBeVisible();
    await expect(page.locator('h3:has-text("Catat Pengeluaran Baru")')).toBeVisible();

    // Assert custom category is auto-selected
    await expect(page.locator('text="Kategori custom baru berhasil dibuat."').first()).toBeVisible({ timeout: 5000 });
    // Verify the new category button is active/rendered in the grid
    await expect(page.locator(`button:has-text("${customCategoryTitle}")`)).toBeVisible();

    // Fill amount & description for this custom category expense
    await page.fill('input[type="date"]', today as string);
    await page.fill('input[type="number"]', '250000');
    await page.fill('textarea', 'Langganan cloud recording CCTV 8 channel');

    // Save expense
    await page.click('button:has-text("Simpan Pengeluaran")');
    await expect(page.locator('text="Pengeluaran baru telah dicatat."').first()).toBeVisible({ timeout: 5000 });

    // Assert row in history table
    await expect(page.locator('table')).toContainText(customCategoryTitle);
    await expect(page.locator('table')).toContainText('250.000');
    await expect(page.locator('table')).toContainText('Langganan cloud recording CCTV 8 channel');

    // ----------------------------------------------------
    // Scenario 3: Verify Standalone Shortcut & Cancel State
    // ----------------------------------------------------
    // Klik tombol shortcut "Kategori Baru" dari tabel dashboard
    const shortcutButton = page.locator('button', { hasText: 'Kategori Baru' }).first();
    await shortcutButton.click();

    // Pastikan modal kategori terbuka
    await expect(page.locator('h4:has-text("Buat Kategori Pengeluaran Baru")')).toBeVisible();
    // Pastikan form pengeluaran tidak ikut terbuka
    await expect(page.locator('h3:has-text("Catat Pengeluaran Baru")')).not.toBeVisible();

    // Klik Batal
    await page.click('button:has-text("Batal")');

    // Pastikan modal kategori tertutup dan form pengeluaran TETAP tidak terbuka
    await expect(page.locator('h4:has-text("Buat Kategori Pengeluaran Baru")')).not.toBeVisible();
    await expect(page.locator('h3:has-text("Catat Pengeluaran Baru")')).not.toBeVisible();

    // ----------------------------------------------------
    // Scenario 4: Delete Custom Category
    // ----------------------------------------------------
    await page.click('button:has-text("Catat Pengeluaran")');
    await expect(page.locator('h3:has-text("Catat Pengeluaran Baru")')).toBeVisible();

    // Custom category card should have a delete button
    const customCatCard = page.locator('div.relative.group', { hasText: customCategoryTitle });
    await expect(customCatCard).toBeVisible();
    await customCatCard.locator('button[title="Hapus kategori custom ini"]').click();

    // Toast category deleted
    await expect(page.locator('text=telah dihapus').first()).toBeVisible({ timeout: 5000 });
    // Verify it is removed from grid
    await expect(page.locator(`button:has-text("${customCategoryTitle}")`)).not.toBeVisible();

    // Close modal
    await page.click('button:has-text("Batal")');

    // ----------------------------------------------------
    // Scenario 5: Delete Expense Transaction
    // ----------------------------------------------------
    const rowToDelete = page.locator('tr', { hasText: 'Langganan cloud recording CCTV 8 channel' });
    await rowToDelete.locator('button[title="Hapus Pengeluaran"]').click();
    
    // Wait for the deletion success toast.
    await expect(page.locator('text="Dihapus"').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('table')).not.toContainText('Langganan cloud recording CCTV 8 channel');
  });
});
