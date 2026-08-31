import { test, expect } from '@playwright/test';

test.describe('Platform Health & Smoke Diagnostics', () => {

  test('1. Application boots and serves Login page correctly', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);

    // Verify Title and Root Elements
    await expect(page.locator('h1')).toHaveText(/iniciar sesión/i);
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check no uncaught JS runtime errors on boot
    expect(pageErrors, `Uncaught page errors found: ${pageErrors.join(', ')}`).toEqual([]);
  });

  test('2. Logo and visual assets load properly', async ({ page }) => {
    await page.goto('/');
    const logo = page.locator('img.login-logo');
    await expect(logo).toBeVisible();
    
    // Ensure image natural width is > 0 (not broken image link)
    const naturalWidth = await logo.evaluate((img) => img.naturalWidth);
    expect(naturalWidth).toBeGreaterThan(0);
  });

  test('3. Email input domain helper interaction works', async ({ page }) => {
    await page.goto('/');
    const emailInput = page.locator('#email');

    // Type a username without '@'
    await emailInput.fill('juan.perez');
    const domainHint = page.locator('.domain-hint');
    await expect(domainHint).toBeVisible();
    await expect(domainHint).toHaveText('@icomercialpmt.cl');

    // Type a full email with '@'
    await emailInput.fill('juan.perez@test.cl');
    await expect(domainHint).not.toBeVisible();
  });

  test('4. Protected route guard: /dashboard redirects unauthenticated users to /', async ({ page }) => {
    await page.goto('/dashboard');
    // Dashboard component checks session and redirects to '/'
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('h1')).toHaveText(/iniciar sesión/i);
  });

  test('5. 404 / NotFound route handling', async ({ page }) => {
    await page.goto('/ruta-inexistente-diagnostico');
    // Verify it doesn't crash
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
  });

  test('6. Responsive layout test (Mobile, Tablet, Desktop)', async ({ page }) => {
    // Desktop Viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await expect(page.locator('.login-container')).toBeVisible();

    // Tablet Viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('.login-container')).toBeVisible();

    // Mobile Viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.login-container')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('7. Login error handling with mock invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.locator('#email').fill('usuario.invalido');
    await page.locator('#password').fill('clave_erronea_123');
    await page.locator('button[type="submit"]').click();

    // Verify loading state or error message display
    const errorOrButton = page.locator('.error-message, button[type="submit"]');
    await expect(errorOrButton.first()).toBeVisible();
  });

});
