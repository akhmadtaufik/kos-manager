import { test, expect } from '@playwright/test';

test.describe.serial('Tenant SaaS Directory & Kemendagri Journey', () => {
  test.setTimeout(180000);

  const timestamp = Date.now();
  const userName = `Owner Kemendagri ${timestamp}`;
  const userEmail = `owner_kemendagri_${timestamp}@test.com`;
  const userPassword = 'Password123!';
  const propertyName = `Kos Kemendagri ${timestamp}`;
  const roomNumber = `R-${timestamp.toString().slice(-4)}`;
  const tenantName = `Budi Kemendagri ${timestamp}`;
  const tenantPhone = '081234567890';
  const emergencyContact = 'Ibu Siti (081298765432)';

  test('Complete Tenant Workflow: Zero Static Form -> Slide-over Onboarding -> Kemendagri Cascade -> 360 Profile -> Checkout', async ({ page }) => {
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

    // ---- Step 3: Create Room via Slide-over ----
    await page.locator('nav').locator('text=Rooms').click();
    await expect(page.locator('h1:has-text("Manajemen Kamar")')).toBeVisible();
    await page.click('#btn-add-room');
    const roomFormPanel = page.locator('#room-form-slideover-panel');
    await expect(roomFormPanel).toBeVisible();
    await roomFormPanel.locator('#input-room-number').fill(roomNumber);
    await roomFormPanel.locator('#input-room-rate').fill('1500000');
    await roomFormPanel.locator('#btn-submit-room-form').click();
    await expect(roomFormPanel).not.toBeVisible();
    await expect(page.locator('#rooms-grid')).toContainText(roomNumber);

    // ---- Step 4: Navigate to Tenants Directory ----
    await page.locator('nav').locator('text=Tenants').click();
    await expect(page.locator('h1:has-text("Direktori Penghuni")')).toBeVisible();

    // Assert: Giant static form is GONE from main page
    await expect(page.locator('#tenant-form-slideover-panel')).not.toBeVisible();
    await expect(page.locator('#btn-onboard-tenant')).toBeVisible();

    // ---- Step 5: Open Onboarding Slide-over ----
    await page.click('#btn-onboard-tenant');
    const formPanel = page.locator('#tenant-form-slideover-panel');
    await expect(formPanel).toBeVisible();
    await expect(formPanel).toContainText('Pendaftaran Penghuni Baru');

    // Fill form fields
    await formPanel.locator('#select-room').selectOption({ index: 1 });
    await formPanel.locator('#input-tenant-name').fill(tenantName);
    await formPanel.locator('#input-tenant-phone').fill(tenantPhone);
    await formPanel.locator('#input-tenant-emergency').fill(emergencyContact);
    await formPanel.locator('#input-tenant-checkin').fill('2026-06-01');

    // Kemendagri Cascading Dropdowns
    // 1. Select Province (DKI JAKARTA - id: 31)
    await formPanel.locator('#province-select').selectOption({ label: 'DKI JAKARTA' });

    // 2. Wait for Regencies to populate and select "KOTA ADM. JAKARTA PUSAT" (id: 3171)
    await expect(formPanel.locator('#regency-select option')).toHaveCount(7, { timeout: 10000 });
    await formPanel.locator('#regency-select').selectOption({ label: 'KOTA ADM. JAKARTA PUSAT' });

    // 3. Wait for Districts to populate and select "GAMBIR" (id: 3171010)
    await expect(formPanel.locator('#district-select option')).toHaveCount(9, { timeout: 10000 });
    await formPanel.locator('#district-select').selectOption({ label: 'GAMBIR' });

    // Submit Onboarding Form
    await formPanel.locator('#btn-submit-tenant-form').click();
    await expect(formPanel).not.toBeVisible({ timeout: 10000 });

    // ---- Step 6: Verify Appearance in Directory Table ----
    const tenantRow = page.locator('tr', { hasText: tenantName });
    await expect(tenantRow).toBeVisible();
    await expect(tenantRow).toContainText(tenantPhone);
    await expect(tenantRow).toContainText('Aktif');
    await expect(tenantRow).toContainText('GAMBIR, KOTA ADM. JAKARTA PUSAT, DKI JAKARTA');

    // ---- Step 7: Open Tenant 360 Profile Slide-over ----
    await tenantRow.click();
    const profilePanel = page.locator('#tenant-profile-slideover-panel');
    await expect(profilePanel).toBeVisible();
    await expect(profilePanel).toContainText(tenantName);
    await expect(profilePanel).toContainText('Seluruh Tagihan Lunas');
    await expect(profilePanel).toContainText(emergencyContact);
    await expect(profilePanel).toContainText(`Kamar ${roomNumber}`);
    await expect(profilePanel).toContainText('GAMBIR, KOTA ADM. JAKARTA PUSAT, DKI JAKARTA');

    // Close Profile Slide-over
    await profilePanel.locator('#btn-close-tenant-profile').click();
    await expect(profilePanel).not.toBeVisible();

    // ---- Step 8: Checkout Flow via ConfirmModal ----
    // Click Checkout icon in table row
    await tenantRow.locator('button[title="Check Out Penghuni"]').click();

    // ConfirmModal should appear
    const confirmDialog = page.locator('div[role="dialog"]');
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog).toContainText('Checkout Penghuni');
    await confirmDialog.locator('button:has-text("Ya, Checkout")').click();

    // Verify status updated to Non-Aktif
    await expect(tenantRow).toContainText('Non-Aktif');
  });
});
