import { test, expect } from '@playwright/test';

test.describe('Authentication Journey', () => {
  let uniqueTimestamp: string;
  let ownerEmail: string;
  let operatorEmail: string;

  test.beforeEach(() => {
    // Generate unique emails for each test run to prevent database collisions
    uniqueTimestamp = Date.now().toString();
    ownerEmail = `owner_${uniqueTimestamp}@kosmanager.test`;
    operatorEmail = `operator_${uniqueTimestamp}@kosmanager.test`;
  });

  test('Registration & Zod Validation Testing', async ({ page }) => {
    await page.goto('/');

    // Toggle to Registration form using exact match for the tab switcher button
    await page.getByRole('button', { name: 'Create Account', exact: true }).click();

    // Ensure register form is visible
    await expect(page.locator('input#reg-email')).toBeVisible();

    // Negative Test (Weak Password)
    await page.locator('input#reg-name').fill('Test Owner');
    await page.locator('input#reg-email').fill(`weak_${ownerEmail}`);
    await page.locator('input#reg-password').fill('123'); // Triggers Zod validation instantly
    
    // Wait for the real-time validation to kick in
    await expect(page.locator('p.text-danger-500:has-text("Password must be at least 8 characters")')).toBeVisible();

    // Positive Test (Owner Registration)
    await page.locator('input#reg-email').fill(ownerEmail);
    // Replace with a strict password satisfying all regexes
    await page.locator('input#reg-password').fill('StrongPass1!');

    // Submit the form
    await page.locator('form').filter({ has: page.locator('input#reg-email') }).locator('button[type="submit"]').click();

    // Assert successful redirect to onboarding (since role is pending)
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 });
  });

  test('Login Security (User Enumeration Prevention)', async ({ page, request }) => {
    await page.goto('/');
    
    // Negative Test (Unregistered Email)
    await page.locator('input#login-email').fill(`not_exist_${uniqueTimestamp}@test.com`);
    await page.locator('input#login-password').fill('SomePassword1!');
    
    let startTime = Date.now();
    await page.locator('form').filter({ has: page.locator('input#login-email') }).locator('button[type="submit"]').click();

    // Assert generic error
    await expect(page.locator('.bg-danger-50')).toContainText('Invalid email or password');
    let duration = Date.now() - startTime;
    // Verify the brute-force delay occurred (expecting ~1500ms delay from the backend)
    expect(duration).toBeGreaterThanOrEqual(1400);

    // Negative Test (Wrong Password)
    // First, programmatically seed an owner user in the database
    const createOwnerRes = await request.post('/api/auth/register', {
      data: {
        name: 'Existing Owner',
        email: ownerEmail,
        password: 'ValidPassword1!',
        role: 'owner'
      }
    });
    expect(createOwnerRes.ok()).toBeTruthy();

    await page.locator('input#login-email').fill(ownerEmail);
    await page.locator('input#login-password').fill('WrongPassword2@');
    
    // Clear any previous error by ensuring it's hidden before we click again
    // Vue's reactivity clears the error on input change, we just wait for it to be removed from the DOM
    await expect(page.locator('.bg-danger-50')).toBeHidden();

    startTime = Date.now();
    
    // Wait for the auth backend to respond to ensure we don't measure DOM staleness
    const responsePromise = page.waitForResponse(res => res.url().includes('/api/auth/callback/credentials'));
    
    await page.locator('form').filter({ has: page.locator('input#login-email') }).locator('button[type="submit"]').click();
    await responsePromise;

    // Assert exact same generic error to prevent user enumeration
    await expect(page.locator('.bg-danger-50')).toContainText('Invalid email or password');

    // Verify brute force delay applies here too
    duration = Date.now() - startTime;
    expect(duration).toBeGreaterThanOrEqual(1400);
  });

  test('Role-Based Login (Positive Flows)', async ({ page, request }) => {
    // Programmatically create owner and operator to test login flows cleanly
    const ownerRes = await request.post('/api/auth/register', {
      data: {
        name: 'Owner User',
        email: ownerEmail,
        password: 'ValidPassword1!',
        role: 'owner'
      }
    });
    expect(ownerRes.ok()).toBeTruthy();

    const operatorRes = await request.post('/api/auth/register', {
      data: {
        name: 'Operator User',
        email: operatorEmail,
        password: 'ValidPassword1!',
        role: 'operator'
      }
    });
    expect(operatorRes.ok()).toBeTruthy();

    // Owner Login
    await page.goto('/');
    await page.locator('input#login-email').fill(ownerEmail);
    await page.locator('input#login-password').fill('ValidPassword1!');
    await page.locator('form').filter({ has: page.locator('input#login-email') }).locator('button[type="submit"]').click();

    // Verify successful authentication and redirect
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Logout by clearing context cookies to simulate fresh state
    await page.context().clearCookies();

    // Operator Login
    await page.goto('/');
    await page.locator('input#login-email').fill(operatorEmail);
    await page.locator('input#login-password').fill('ValidPassword1!');
    await page.locator('form').filter({ has: page.locator('input#login-email') }).locator('button[type="submit"]').click();

    // Verify successful authentication and redirect for operator
    await expect(page).toHaveURL(/\/dashboard/);

    // Explicitly perform Logout from the UI
    await page.click('button:has-text("Logout")');

    // Verify redirect back to root (login page)
    await expect(page).toHaveURL('http://localhost:3000/');

    // Assert dashboard elements are gone (session destroyed)
    await expect(page.locator('#property-switcher')).toBeHidden();

    // Verify the login form is rendered
    await expect(page.locator('input#login-email')).toBeVisible();
  });
});
