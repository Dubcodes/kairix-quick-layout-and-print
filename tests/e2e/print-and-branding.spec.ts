import { expect, test, type Page } from '@playwright/test';

async function installPrintStub(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'print', {
      configurable: true,
      value: () => { (window as Window & { __kairixPrintCalled?: boolean }).__kairixPrintCalled = true; },
    });
  });
}

async function openPrintDocument(page: Page) {
  await page.getByRole('button', { name: 'Print', exact: true }).click();
  const printFrame = page.locator('[data-testid="print-document"]');
  await expect(printFrame).toHaveCount(1);
  await expect(printFrame.contentFrame().locator('#kairix-print-image')).toHaveAttribute('src', /^blob:/);
  return printFrame;
}

test('Print is visible, keyboard accessible, explained and isolated from editor UI', async ({ page }) => {
  await installPrintStub(page);
  await page.goto('/');

  const print = page.getByRole('button', { name: 'Print', exact: true });
  await expect(print).toBeVisible();
  await expect(page.getByText('Use Actual Size or 100% if your printer dialog offers scaling options.')).toBeVisible();
  await print.hover();
  await expect(page.getByRole('tooltip')).toHaveText('Open your device’s print dialog.');
  await print.focus();
  await page.keyboard.press('Enter');

  const frame = page.locator('[data-testid="print-document"]');
  await expect(frame.contentFrame().locator('#kairix-print-image')).toHaveAttribute('src', /^blob:/);
  await expect(frame.contentFrame().locator('html')).toHaveAttribute('data-paper-width-mm', '210');
  await expect(frame.contentFrame().locator('html')).toHaveAttribute('data-paper-height-mm', '297');
  await expect(frame.contentFrame().locator('html')).toHaveAttribute('data-orientation', 'portrait');
  await expect(frame.contentFrame().locator('body > *')).toHaveCount(1);
  await expect(frame.contentFrame().locator('#kairix-print-image')).toHaveAttribute('data-pixel-width', '2480');
  await expect(frame.contentFrame().locator('#kairix-print-image')).toHaveAttribute('data-pixel-height', '3508');
  await expect(frame.contentFrame().locator('header, nav, aside, footer, button, canvas, .tooltip-bubble, .safe-margin')).toHaveCount(0);
});

test('Print receives landscape and custom physical paper dimensions', async ({ page }) => {
  await installPrintStub(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Landscape', exact: true }).click();
  let frame = await openPrintDocument(page);
  await expect(frame.contentFrame().locator('html')).toHaveAttribute('data-paper-width-mm', '297');
  await expect(frame.contentFrame().locator('html')).toHaveAttribute('data-paper-height-mm', '210');

  await page.reload();
  await page.getByLabel('Paper size').selectOption('custom');
  await page.getByLabel('Width (mm)').fill('176.4');
  await page.getByLabel('Height (mm)').fill('231.8');
  frame = await openPrintDocument(page);
  await expect(frame.contentFrame().locator('html')).toHaveAttribute('data-paper-width-mm', '176.4');
  await expect(frame.contentFrame().locator('html')).toHaveAttribute('data-paper-height-mm', '231.8');
});

test('unsupported printing reports a clear PNG fallback', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'print', { configurable: true, value: undefined });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Print', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('does not provide a usable print dialog');
  await expect(page.getByRole('alert')).toContainText('Use Export PNG as a fallback.');
});

test('local branding links, image paths and canonical metadata are exact', async ({ page }) => {
  await page.goto('/');
  const coffee = page.getByRole('link', { name: 'Support Dubcodes on Buy Me a Coffee' });
  await expect(coffee).toHaveAttribute('href', 'https://buymeacoffee.com/dubcodes');
  await expect(coffee).toHaveAttribute('target', '_blank');
  await expect(coffee).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(coffee.locator('img')).toHaveAttribute('src', '/assets/coffee_logo.png');
  await coffee.hover();
  await expect(page.getByRole('tooltip')).toHaveText('Support the project');

  await page.locator('.about-links summary').click();
  await expect(page.getByRole('img', { name: 'Dubcodes Media' })).toHaveAttribute('src', '/assets/dubcodes_media_logo.png');
  await expect(page.getByText('Version 0.1.0')).toBeVisible();
  const official = page.getByRole('link', { name: 'View the official project page' });
  await expect(official).toHaveAttribute('href', 'https://www.dubcodesmedia.com/kairix/kairix-quick-layout-and-print');
  await expect(official).toHaveAttribute('target', '_blank');
  await expect(official).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://easyprint.dubcodesmedia.com');
});

test('missing branding images fail gracefully without hiding text links', async ({ page }) => {
  await page.route('**/assets/coffee_logo.png', (route) => route.abort());
  await page.route('**/assets/dubcodes_media_logo.png', (route) => route.abort());
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Support Dubcodes on Buy Me a Coffee' })).toHaveCount(0);
  await page.locator('.about-links summary').click();
  await expect(page.getByRole('img', { name: 'Dubcodes Media' })).toHaveCount(0);
  await expect(page.locator('.about-links__content').getByText('Kairix Quick Layout & Print', { exact: true })).toBeVisible();
  await expect(page.getByText('Version 0.1.0')).toBeVisible();
  await expect(page.getByRole('link', { name: 'View the official project page' })).toBeVisible();
});

test('narrow mobile keeps output actions and footer support link in normal flow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Add photos', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Auto Arrange', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Print', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export PNG', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Support Dubcodes on Buy Me a Coffee' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  const footer = await page.locator('.app-footer').boundingBox();
  const settings = await page.locator('.settings-panel').boundingBox();
  expect(footer).not.toBeNull();
  expect(settings).not.toBeNull();
  expect(footer!.y).toBeGreaterThanOrEqual(settings!.y + settings!.height - 1);
});
