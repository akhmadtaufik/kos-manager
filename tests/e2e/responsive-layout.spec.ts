import { test, expect } from '@playwright/test';

test.describe('Responsive Mobile Layout', () => {
  let uniqueTimestamp: string;
  let ownerEmail: string;

  test.beforeEach(async ({ request }) => {
    uniqueTimestamp = Date.now().toString();
    ownerEmail = `owner_${uniqueTimestamp}@kosmanager.test`;

    // Programmatically seed an owner user
    const res = await request.post('/api/auth/register', {
      data: {
        name: 'Responsive Owner',
        email: ownerEmail,
        password: 'ValidPassword1!',
        role: 'owner'
      }
    });
    expect(res.ok()).toBeTruthy();
  });

  test('Mobile UI: No horizontal overflow and minimum 44px touch targets', async ({ page, isMobile }) => {
    // Only run this test on mobile viewports
    if (!isMobile) {
      test.skip();
    }

    // Login Journey
    await page.goto('/');
    await page.locator('input#login-email').fill(ownerEmail);
    await page.locator('input#login-password').fill('ValidPassword1!');
    await page.locator('form').filter({ has: page.locator('input#login-email') }).locator('button[type="submit"]').click();

    // Verify dashboard loaded
    await expect(page).toHaveURL(/\/dashboard/);

    // Give Nuxt time to hydrate and render the layout fully
    await page.waitForTimeout(1000);

    // 1. Horizontal Overflow Assertion
    // Evaluate if the scrollWidth exceeds innerWidth.
    // Slop UIs often accidentally cause horizontal scrolling on mobile.
    const hasNoOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth;
    });
    expect(hasNoOverflow).toBeTruthy();

    // 2. Touch Target Size Assertion
    // Check the hamburger button (aria-label="Open sidebar")
    const hamburgerBtn = page.locator('button[aria-label="Open sidebar"]');
    await expect(hamburgerBtn).toBeVisible();
    
    const box = await hamburgerBtn.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      // Must be at least 44x44px for accessible mobile touch targets
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }

    // 3. Mobile Navigation Functionality
    // Click the hamburger and ensure sidebar becomes visible
    await hamburgerBtn.click();
    
    // The sidebar has a fixed inset-0 overlay when open.
    // We can check if the overlay exists or wait for the sidebar inner content
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
  });

  test('Mobile UI: Data Tables transformed to Cards (No Overflow)', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
    }

    // Login Journey
    await page.goto('/');
    await page.locator('input#login-email').fill(ownerEmail);
    await page.locator('input#login-password').fill('ValidPassword1!');
    await page.locator('form').filter({ has: page.locator('input#login-email') }).locator('button[type="submit"]').click();

    // Wait until dashboard is loaded (client-side app is hydrated)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    await page.waitForTimeout(1500);

    // Navigate to Properties via client-side router (no full SSR reload)
    await page.evaluate(() => { window.location.href = '/properties'; });
    await page.waitForURL(/\/properties/, { timeout: 20000 });
    await page.waitForTimeout(1000);

    // Verify horizontal overflow is non-existent
    let hasNoOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth;
    });
    expect(hasNoOverflow).toBeTruthy();

    // Navigate to Rooms via client-side router
    await page.evaluate(() => { window.location.href = '/rooms'; });
    await page.waitForURL(/\/rooms/, { timeout: 20000 });
    await page.waitForTimeout(1000);

    // Verify horizontal overflow is non-existent
    hasNoOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth;
    });
    expect(hasNoOverflow).toBeTruthy();
  });
});
