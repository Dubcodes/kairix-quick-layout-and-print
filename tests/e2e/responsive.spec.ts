import { expect, test } from '@playwright/test';

test('desktop viewport exposes the full editing workspace', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Photos' })).toBeVisible();
  await expect(page.getByTestId('canvas-workspace')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Paper & export' })).toBeVisible();
});

test('Android-sized viewport keeps the editor and export controls usable', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto('/');
  await expect(page.getByText('Your photos stay on this device.')).toBeVisible();
  await expect(page.getByTestId('canvas-workspace')).toBeVisible();
  await page.getByRole('button', { name: 'Export PNG' }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: 'Export PNG' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(412);
  await expect(page.getByRole('button', { name: 'Add photos', exact: true })).toHaveCSS('min-height', '44px');
});

test('narrow mobile viewport has no page-level horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await expect(page.getByRole('button', { name: 'Add photos', exact: true })).toBeVisible();
  await expect(page.getByTestId('canvas-workspace')).toBeVisible();
  await expect(page.locator('.page-shadow')).toHaveCSS('touch-action', 'none');
});
