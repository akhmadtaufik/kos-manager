import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import postgres from 'postgres';
import crypto from 'crypto';

const dbUrl = process.env.DATABASE_MIGRATE_URL || process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5435/kosmanager';
const sql = postgres(dbUrl);

async function seedEnterpriseDashboardData(ownerId: string, prop1Id: string, timestamp: number) {
  // 1. Create Second Property: Kos Grand Pavilion Residence (Bandung)
  const prop2Id = crypto.randomUUID();
  await sql`
    INSERT INTO properties (id, user_id, name, address, created_at, updated_at)
    VALUES (
      ${prop2Id},
      ${ownerId},
      ${`Kos Grand Pavilion Residence ${timestamp}`},
      'Jl. Dago Asri No. 18, Coblong, Kota Bandung, Jawa Barat',
      '2026-01-01 00:00:00',
      '2026-01-01 00:00:00'
    )
  `;

  await sql`
    INSERT INTO user_properties (user_id, property_id, permissions, assigned_at)
    VALUES (
      ${ownerId},
      ${prop2Id},
      ${JSON.stringify([
        'rooms:read', 'rooms:create', 'rooms:update', 'rooms:delete',
        'tenants:read', 'tenants:create', 'tenants:update', 'tenants:delete',
        'payments:read', 'payments:create', 'payments:update', 'payments:delete',
        'expenses:read', 'expenses:create', 'expenses:update', 'expenses:delete',
        'reports:read'
      ])},
      '2026-01-01 00:00:00'
    )
    ON CONFLICT (user_id, property_id) DO NOTHING
  `;

  // 2. Define Rooms for both properties
  // Property 1 (Depok): Rooms 102 - 108 (Room 101 created via UI)
  const prop1Rooms = [
    { id: crypto.randomUUID(), propId: prop1Id, num: '102', status: 'occupied', rate: 1800000, fees: [{ name: 'WiFi High Speed', amount: 50000 }] },
    { id: crypto.randomUUID(), propId: prop1Id, num: '103', status: 'occupied', rate: 2200000, fees: [{ name: 'Parkir Mobil', amount: 200000 }] },
    { id: crypto.randomUUID(), propId: prop1Id, num: '104', status: 'occupied', rate: 1800000, fees: [] },
    { id: crypto.randomUUID(), propId: prop1Id, num: '105', status: 'occupied', rate: 2500000, fees: [{ name: 'Laundry & Cleaning', amount: 100000 }] },
    { id: crypto.randomUUID(), propId: prop1Id, num: '106', status: 'occupied', rate: 1800000, fees: [] },
    { id: crypto.randomUUID(), propId: prop1Id, num: '107', status: 'occupied', rate: 2000000, fees: [] },
    { id: crypto.randomUUID(), propId: prop1Id, num: '108', status: 'available', rate: 2200000, fees: [] },
  ];

  // Property 2 (Bandung): Rooms 201 - 209
  const prop2Rooms = [
    { id: crypto.randomUUID(), propId: prop2Id, num: '201', status: 'occupied', rate: 2000000, fees: [] },
    { id: crypto.randomUUID(), propId: prop2Id, num: '202', status: 'occupied', rate: 2000000, fees: [{ name: 'WiFi Premium', amount: 50000 }] },
    { id: crypto.randomUUID(), propId: prop2Id, num: '203', status: 'occupied', rate: 2400000, fees: [{ name: 'Water Heater', amount: 100000 }] },
    { id: crypto.randomUUID(), propId: prop2Id, num: '204', status: 'occupied', rate: 2000000, fees: [] },
    { id: crypto.randomUUID(), propId: prop2Id, num: '205', status: 'occupied', rate: 2800000, fees: [{ name: 'Private Balcony', amount: 250000 }] },
    { id: crypto.randomUUID(), propId: prop2Id, num: '206', status: 'occupied', rate: 2000000, fees: [] },
    { id: crypto.randomUUID(), propId: prop2Id, num: '207', status: 'occupied', rate: 2400000, fees: [] },
    { id: crypto.randomUUID(), propId: prop2Id, num: '208', status: 'available', rate: 2000000, fees: [] },
    { id: crypto.randomUUID(), propId: prop2Id, num: '209', status: 'available', rate: 2500000, fees: [] },
  ];

  const allSeedRooms = [...prop1Rooms, ...prop2Rooms];
  for (const r of allSeedRooms) {
    await sql`
      INSERT INTO rooms (id, property_id, room_number, status, monthly_rate, additional_fees, created_at, updated_at)
      VALUES (
        ${r.id},
        ${r.propId},
        ${r.num},
        ${r.status},
        ${r.rate},
        ${JSON.stringify(r.fees)},
        '2026-01-01 00:00:00',
        '2026-01-01 00:00:00'
      )
      ON CONFLICT DO NOTHING
    `;
  }

  // 3. Define Tenants with official Kemendagri codes (Kota vs Kabupaten)
  const tenantDefinitions = [
    { roomId: prop1Rooms[0]!.id, propId: prop1Id, name: 'Siti Rahmawati', phone: '081211112222', prov: '32', reg: '3273', dist: '3273010', checkIn: '2026-02-01', active: 1 }, // KOTA BANDUNG
    { roomId: prop1Rooms[1]!.id, propId: prop1Id, name: 'Ahmad Hidayat', phone: '081222223333', prov: '32', reg: '3201', dist: '3201010', checkIn: '2026-01-10', active: 1 }, // KABUPATEN BOGOR
    { roomId: prop1Rooms[2]!.id, propId: prop1Id, name: 'Dewi Lestari', phone: '081233334444', prov: '34', reg: '3404', dist: '3404010', checkIn: '2026-03-01', active: 1 }, // KABUPATEN SLEMAN
    { roomId: prop1Rooms[3]!.id, propId: prop1Id, name: 'Rizky Pratama', phone: '081244445555', prov: '31', reg: '3174', dist: '3174010', checkIn: '2026-02-15', active: 1 }, // KOTA ADM. JAKARTA SELATAN
    { roomId: prop1Rooms[4]!.id, propId: prop1Id, name: 'Fajar Nugraha', phone: '081255556666', prov: '35', reg: '3578', dist: '3578010', checkIn: '2026-04-01', active: 1 }, // KOTA SURABAYA
    { roomId: prop1Rooms[5]!.id, propId: prop1Id, name: 'Maya Indah', phone: '081266667777', prov: '32', reg: '3276', dist: '3276010', checkIn: '2026-01-20', active: 1 }, // KOTA DEPOK
    { roomId: prop2Rooms[0]!.id, propId: prop2Id, name: 'Eko Prasetyo', phone: '081277778888', prov: '33', reg: '3374', dist: '3374010', checkIn: '2026-02-01', active: 1 }, // KOTA SEMARANG
    { roomId: prop2Rooms[1]!.id, propId: prop2Id, name: 'Nadia Safitri', phone: '081288889999', prov: '36', reg: '3674', dist: '3674010', checkIn: '2026-01-15', active: 1 }, // KOTA TANGERANG SELATAN
    { roomId: prop2Rooms[2]!.id, propId: prop2Id, name: 'Dimas Anggara', phone: '081299990000', prov: '32', reg: '3204', dist: '3204010', checkIn: '2026-03-10', active: 1 }, // KABUPATEN BANDUNG
    { roomId: prop2Rooms[3]!.id, propId: prop2Id, name: 'Anisa Putri', phone: '081311112222', prov: '51', reg: '5171', dist: '5171010', checkIn: '2026-01-05', active: 1 }, // KOTA DENPASAR
    { roomId: prop2Rooms[4]!.id, propId: prop2Id, name: 'Hendro Wijaya', phone: '081322223333', prov: '12', reg: '1271', dist: '1271010', checkIn: '2026-02-20', active: 1 }, // KOTA MEDAN
    { roomId: prop2Rooms[5]!.id, propId: prop2Id, name: 'Putri Ayu', phone: '081333334444', prov: '51', reg: '5103', dist: '5103010', checkIn: '2026-05-01', active: 1 }, // KABUPATEN BADUNG
    { roomId: prop2Rooms[6]!.id, propId: prop2Id, name: 'Rangga Permana', phone: '081344445555', prov: '36', reg: '3603', dist: '3603010', checkIn: '2026-03-01', active: 1 }, // KABUPATEN TANGERANG
    // Historical check-outs
    { roomId: prop1Rooms[6]!.id, propId: prop1Id, name: 'Gilang Ramadhan', phone: '081355556666', prov: '31', reg: '3171', dist: '3171010', checkIn: '2026-01-01', checkOut: '2026-06-30', active: 0 },
    { roomId: prop2Rooms[7]!.id, propId: prop2Id, name: 'Laras Sekar', phone: '081366667777', prov: '32', reg: '3273', dist: '3273010', checkIn: '2026-01-01', checkOut: '2026-07-31', active: 0 }
  ];

  const seededTenants: Array<{ id: string; propId: string; rate: number; fees: any[]; checkIn: string; active: number; name: string }> = [];

  for (const t of tenantDefinitions) {
    const tenantId = crypto.randomUUID();
    const room = allSeedRooms.find(r => r.id === t.roomId)!;
    await sql`
      INSERT INTO tenants (
        id, room_id, name, phone, emergency_contact,
        province_id, regency_id, district_id,
        check_in, check_out, is_active, created_at, updated_at
      )
      VALUES (
        ${tenantId},
        ${t.roomId},
        ${t.name},
        ${t.phone},
        'Kontak Keluarga (081200009999)',
        ${t.prov},
        ${t.reg},
        ${t.dist},
        ${t.checkIn},
        ${t.checkOut ? t.checkOut : null},
        ${t.active},
        ${t.checkIn + ' 00:00:00'},
        ${t.checkIn + ' 00:00:00'}
      )
    `;

    seededTenants.push({
      id: tenantId,
      propId: t.propId,
      rate: room.rate,
      fees: room.fees,
      checkIn: t.checkIn,
      active: t.active,
      name: t.name
    });
  }

  // 4. Generate 6-Month Billing History (March 2026 – August 2026)
  const months = ['2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08'];

  for (const month of months) {
    for (const t of seededTenants) {
      if (t.checkIn.slice(0, 7) > month) continue; // Not checked in yet
      if (!t.active && month === '2026-08') continue; // Inactive in August

      const feeSum = t.fees.reduce((sum, f) => sum + f.amount, 0);
      const totalAmount = t.rate + feeSum;
      const paymentId = crypto.randomUUID();

      let status = 'paid';
      let amountPaid = totalAmount;
      let paidAt: string | null = `${month}-05 10:00:00`;

      // Status breakdown for the current active month (August 2026)
      if (month === '2026-08') {
        if (t.name === 'Dewi Lestari') {
          // Partial payment (Rp 1.000.000 paid)
          status = 'partial';
          amountPaid = 1000000;
          paidAt = '2026-08-04 09:30:00';
        } else if (t.name === 'Dimas Anggara') {
          // Partial payment (Rp 1.500.000 paid)
          status = 'partial';
          amountPaid = 1500000;
          paidAt = '2026-08-05 14:15:00';
        } else if (t.name === 'Fajar Nugraha' || t.name === 'Putri Ayu') {
          // Unpaid (Arrears)
          status = 'unpaid';
          amountPaid = 0;
          paidAt = null;
        }
      }

      await sql`
        INSERT INTO payments (
          id, tenant_id, property_id, billing_month,
          base_rent, additional_fees, total_amount, amount_paid,
          status, paid_at, created_at, updated_at
        )
        VALUES (
          ${paymentId},
          ${t.id},
          ${t.propId},
          ${month},
          ${t.rate},
          ${JSON.stringify(t.fees)},
          ${totalAmount},
          ${amountPaid},
          ${status},
          ${paidAt},
          ${month + '-01 00:00:00'},
          ${month + '-01 00:00:00'}
        )
        ON CONFLICT DO NOTHING
      `;

      // Insert transaction ledger if any amount was paid
      if (amountPaid > 0) {
        await sql`
          INSERT INTO payment_transactions (
            id, payment_id, amount, payment_date,
            recorded_by, notes, created_at
          )
          VALUES (
            ${crypto.randomUUID()},
            ${paymentId},
            ${amountPaid},
            ${paidAt || month + '-05 10:00:00'},
            ${ownerId},
            ${status === 'partial' ? 'Cicilan sewa kamar (Tahap 1)' : 'Pelunasan transfer bank BCA'},
            ${paidAt || month + '-05 10:00:00'}
          )
        `;
      }
    }
  }

  // 5. Generate 6-Month Categorized Operational Expenses for both properties
  const expenseTemplates = [
    { cat: 'Listrik & Daya', amount1: 1450000, amount2: 1750000, desc: 'Tagihan Listrik PLN Pascabayar' },
    { cat: 'Air & Sanitasi', amount1: 520000, amount2: 610000, desc: 'Tagihan Air PDAM & Filter' },
    { cat: 'Internet & WiFi', amount1: 850000, amount2: 850000, desc: 'Paket Internet Dedicated 100Mbps' },
    { cat: 'Kebersihan & Sampah', amount1: 450000, amount2: 550000, desc: 'Iuran Sampah & Cleaning Service' },
    { cat: 'Pemeliharaan Gedung', amount1: 750000, amount2: 900000, desc: 'Servis AC & Perbaikan Kran' },
    { cat: 'Keamanan & Hansip', amount1: 600000, amount2: 600000, desc: 'Honor Keamanan Lingkungan' }
  ];

  for (const month of months) {
    for (const exp of expenseTemplates) {
      // Property 1 expense
      await sql`
        INSERT INTO expenses (id, property_id, category, amount, description, date, created_at, updated_at)
        VALUES (
          ${crypto.randomUUID()},
          ${prop1Id},
          ${exp.cat},
          ${exp.amount1},
          ${exp.desc},
          ${month + '-10'},
          ${month + '-10 08:00:00'},
          ${month + '-10 08:00:00'}
        )
      `;

      // Property 2 expense
      await sql`
        INSERT INTO expenses (id, property_id, category, amount, description, date, created_at, updated_at)
        VALUES (
          ${crypto.randomUUID()},
          ${prop2Id},
          ${exp.cat},
          ${exp.amount2},
          ${exp.desc},
          ${month + '-12'},
          ${month + '-12 08:00:00'},
          ${month + '-12 08:00:00'}
        )
      `;
    }
  }
}

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

  test.afterAll(async () => {
    await sql.end();
  });

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

    // 3. Create Property via UI
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

    // Query owner and created property IDs for database mock data seeding
    const ownerRows = await sql`SELECT id FROM users WHERE email = ${ownerEmail}`;
    const ownerId = ownerRows[0]!.id;
    const propRows = await sql`SELECT id FROM properties WHERE user_id = ${ownerId} ORDER BY created_at ASC`;
    const prop1Id = propRows[0]!.id;

    // Inject Rich Enterprise Mock Data Seeder (multi-property, rooms, tenants, 6mo time series & expenses)
    await seedEnterpriseDashboardData(ownerId, prop1Id, timestamp);

    // Refresh properties and select global view
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Select the property in switcher for property-specific views
    await page.locator('#property-switcher').selectOption({ label: propertyName });

    // Capture 2: Properties Grid
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(screenshotDir, 'properties-grid.png'),
      fullPage: true
    });

    // 4. Create Room with Additional Fees via UI
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
    await tenantFormPanel.locator('#select-room').selectOption({ label: `Kamar ${roomNumber}` });
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

    // 9. Dashboard Global View (Captured with Global Switcher & Complete SaaS Charts)
    await page.locator('#sidebar-nav a[href="/dashboard"]').click();
    await page.waitForLoadState('networkidle');

    // Switch to Global View to capture the aggregate metrics across all properties
    const switcher = page.locator('#property-switcher');
    await switcher.selectOption({ label: 'Global View' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Settle sparklines and CSS chart transitions

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
