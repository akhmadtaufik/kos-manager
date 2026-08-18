import { test, expect } from '@playwright/test';

test.describe('Expenses Module & Dynamic Icon Categories Journey', () => {
  const timestamp = Date.now();
  const userName = `Owner Exp ${timestamp}`;
  const userEmail = `owner_exp${timestamp}@example.com`;
  const userPassword = 'Password123!';
  const propertyName = `Property Exp ${timestamp}`;

  test('Comprehensive Expenses Flow: 9 Defaults, Custom Categories, Edit Mode, Filters & Confirm Modal Deletion', async ({ page }) => {
    test.setTimeout(120000);

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
    await expect(page.locator('h4:has-text("Buat Kategori Pengeluaran Baru")')).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('h3:has-text("Catat Pengeluaran Baru")')).toBeVisible({ timeout: 10000 });

    // Assert custom category created toast & rendered in grid
    await expect(page.locator('text="Kategori custom baru berhasil dibuat."').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator(`button:has-text("${customCategoryTitle}")`)).toBeVisible();

    // Select the new category and fill amount & description
    await page.click(`button:has-text("${customCategoryTitle}")`);
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
    const shortcutButton = page.locator('button', { hasText: 'Kategori Baru' }).first();
    await shortcutButton.click();

    await expect(page.locator('h4:has-text("Buat Kategori Pengeluaran Baru")')).toBeVisible();
    await expect(page.locator('h3:has-text("Catat Pengeluaran Baru")')).not.toBeVisible();

    await page.click('button:has-text("Batal")');

    await expect(page.locator('h4:has-text("Buat Kategori Pengeluaran Baru")')).not.toBeVisible();
    await expect(page.locator('h3:has-text("Catat Pengeluaran Baru")')).not.toBeVisible();

    // ----------------------------------------------------
    // Scenario 4: Delete Custom Category with Custom Confirm Modal
    // ----------------------------------------------------
    await page.click('button:has-text("Catat Pengeluaran")');
    await expect(page.locator('h3:has-text("Catat Pengeluaran Baru")')).toBeVisible();

    const customCatCard = page.locator('div.relative.group', { hasText: customCategoryTitle });
    await expect(customCatCard).toBeVisible();
    await customCatCard.locator('button[title="Hapus kategori custom ini"]').click();

    // Confirm modal appears
    await expect(page.locator('div[role="dialog"] h3:has-text("Hapus Kategori")')).toBeVisible();
    await page.locator('div[role="dialog"] button:has-text("Ya, Hapus")').click();

    // Toast category deleted
    await expect(page.locator('text=telah dihapus').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator(`button:has-text("${customCategoryTitle}")`)).not.toBeVisible();

    // Close expense modal
    await page.click('button:has-text("Batal")');

    // ----------------------------------------------------
    // Scenario 5: Edit Expense Flow
    // ----------------------------------------------------
    const rowToEdit = page.locator('tr', { hasText: 'Air Bersih & Sanitasi (PDAM)' });
    await rowToEdit.locator('button[title="Edit Pengeluaran"]').click();

    // Verify Edit Modal appears with prefilled data
    await expect(page.locator('h3:has-text("Edit Pengeluaran")')).toBeVisible();
    await expect(page.locator('input[type="number"]')).toHaveValue('75000');

    // Update amount and note
    await page.fill('input[type="number"]', '95000');
    await page.fill('textarea', 'Pembayaran PDAM Bulan Ini (Updated)');
    await page.click('button:has-text("Simpan Perubahan")');

    // Assert update toast and updated row in table
    await expect(page.locator('text="Data pengeluaran berhasil diperbarui."').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('table')).toContainText('95.000');
    await expect(page.locator('table')).toContainText('Pembayaran PDAM Bulan Ini (Updated)');

    // ----------------------------------------------------
    // Scenario 6: Month / Year Period Filtering
    // ----------------------------------------------------
    // Navigate to previous month
    await page.locator('button[title="Bulan Sebelumnya"]').click();
    // In previous month, no expense should exist
    await expect(page.locator('text="Belum ada pengeluaran di periode ini"')).toBeVisible();

    // Reset to current month using shortcut
    await page.click('button:has-text("Bulan Ini")');
    await expect(page.locator('table')).toContainText('Air Bersih & Sanitasi (PDAM)');
    await expect(page.locator('table')).toContainText('95.000');

    // ----------------------------------------------------
    // Scenario 7: Delete Expense Transaction with Custom Confirm Modal
    // ----------------------------------------------------
    const rowToDelete = page.locator('tr', { hasText: 'Langganan cloud recording CCTV 8 channel' });
    await rowToDelete.locator('button[title="Hapus Pengeluaran"]').click();
    
    // Confirm modal appears
    await expect(page.locator('div[role="dialog"] h3:has-text("Hapus Pengeluaran")')).toBeVisible();
    await page.locator('div[role="dialog"] button:has-text("Ya, Hapus")').click();

    // Wait for the deletion success toast.
    await expect(page.locator('text="Dihapus"').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('table')).not.toContainText('Langganan cloud recording CCTV 8 channel');
  });
});
