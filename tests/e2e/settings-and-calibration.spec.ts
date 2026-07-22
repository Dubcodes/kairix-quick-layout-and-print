import { expect, test } from '@playwright/test';

test('settings persist through refresh and recommended defaults restore completely', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Paper size').selectOption('letter');
  await page.getByRole('button', { name: 'Landscape', exact: true }).click();
  await page.getByRole('button', { name: 'in', exact: true }).click();
  await page.getByLabel('Resolution').selectOption('200');
  await page.waitForTimeout(350);
  await page.reload();

  await expect(page.getByLabel('Paper size')).toHaveValue('letter');
  await expect(page.getByRole('button', { name: 'Landscape', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'in', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Resolution')).toHaveValue('200');

  await page.getByRole('button', { name: 'Restore Recommended Defaults', exact: true }).click();
  await expect(page.getByLabel('Paper size')).toHaveValue('a4');
  await expect(page.getByRole('button', { name: 'Portrait', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'mm', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Resolution')).toHaveValue('300');
  await expect(page.getByText('White background · 5 mm safe margin · 300 DPI metadata')).toBeVisible();
});

test('calibration utility exports an exact A4 PNG through the shared pipeline', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Print calibration', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Print calibration', exact: true })).toBeVisible();
  await expect(page.getByText('Measure the 100 × 100 mm square.')).toBeVisible();
  await expect(page.getByText('Check both labelled 100 mm rulers.')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export calibration PNG', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('kairix-print-calibration-2480x3508.png');
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const png = Buffer.concat(chunks);
  expect(png.readUInt32BE(16)).toBe(2480);
  expect(png.readUInt32BE(20)).toBe(3508);
  expect(png.indexOf(Buffer.from('pHYs'))).toBeGreaterThan(0);
});

test('development mode unregisters stale service workers', async ({ page }) => {
  await page.goto('/');
  await expect.poll(async () => page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length)).toBe(0);
});
