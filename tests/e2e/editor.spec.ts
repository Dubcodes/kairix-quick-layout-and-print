import { expect, test } from '@playwright/test';
import { imageFixtures } from '../fixtures/images';

test('imports at least three images and exports an exact A4 PNG', async ({ page }) => {
  await page.goto('/');
  await page.locator('input[type="file"]').setInputFiles(imageFixtures);
  await expect(page.getByTestId('placed-photo')).toHaveCount(3);
  await expect(page.getByTestId('pixel-dimensions')).toContainText('2,480 × 3,508 px');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export PNG' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('kairix-layout-2480x3508.png');

  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const png = Buffer.concat(chunks);
  expect(png.subarray(1, 4).toString()).toBe('PNG');
  expect(png.readUInt32BE(16)).toBe(2480);
  expect(png.readUInt32BE(20)).toBe(3508);
  expect(png.indexOf(Buffer.from('pHYs'))).toBeGreaterThan(0);
});

test('selected photo controls and undo/redo preserve editor operations', async ({ page }) => {
  await page.goto('/');
  await page.locator('input[type="file"]').setInputFiles([imageFixtures[0]]);
  await page.waitForTimeout(300);
  const state = page.getByTestId('selected-photo-state');
  await expect(state).toContainText('0° · Fit whole photo');

  await page.getByRole('button', { name: 'Fill', exact: true }).click();
  await expect(state).toContainText('0° · Fill frame');
  await page.getByRole('button', { name: 'Rotate 90°', exact: true }).click();
  await expect(state).toContainText('90° · Fill frame');

  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(state).toContainText('0° · Fill frame');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(state).toContainText('0° · Fit whole photo');
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect(state).toContainText('90° · Fill frame');

  await page.getByRole('button', { name: 'Duplicate', exact: true }).click();
  await expect(page.getByTestId('placed-photo')).toHaveCount(2);
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByTestId('placed-photo')).toHaveCount(1);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByTestId('placed-photo')).toHaveCount(2);
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect(page.getByTestId('placed-photo')).toHaveCount(1);
});

test('valid images survive an unsupported file error', async ({ page }) => {
  await page.goto('/');
  await page.locator('input[type="file"]').setInputFiles([
    imageFixtures[0],
    { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image') },
  ]);
  await expect(page.getByTestId('placed-photo')).toHaveCount(1);
  await expect(page.getByRole('alert')).toContainText('only JPEG, PNG and WebP images are supported');
});

test('dragging and resizing update geometry and can be undone', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await page.locator('input[type="file"]').setInputFiles([imageFixtures[0]]);
  await page.waitForTimeout(300);
  const state = page.getByTestId('selected-photo-state');
  const paper = page.locator('.page-shadow');
  const paperBox = await paper.boundingBox();
  if (!paperBox) throw new Error('Paper preview did not render.');

  const initial = {
    x: Number(await state.getAttribute('data-x')),
    y: Number(await state.getAttribute('data-y')),
    width: Number(await state.getAttribute('data-width')),
    height: Number(await state.getAttribute('data-height')),
  };
  const centre = {
    x: paperBox.x + (initial.x + initial.width / 2) * paperBox.width,
    y: paperBox.y + (initial.y + initial.height / 2) * paperBox.height,
  };
  await page.mouse.move(centre.x, centre.y);
  await page.mouse.down();
  await page.mouse.move(centre.x + 35, centre.y + 25, { steps: 5 });
  await page.mouse.up();
  await expect.poll(async () => Number(await state.getAttribute('data-x'))).toBeGreaterThan(initial.x);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect.poll(async () => Number(await state.getAttribute('data-x'))).toBeCloseTo(initial.x, 4);

  const resizeX = paperBox.x + (initial.x + initial.width) * paperBox.width;
  const resizeY = paperBox.y + (initial.y + initial.height) * paperBox.height;
  await page.mouse.move(resizeX, resizeY);
  await page.mouse.down();
  await page.mouse.move(resizeX + 28, resizeY + 22, { steps: 5 });
  await page.mouse.up();
  await expect.poll(async () => Number(await state.getAttribute('data-width'))).toBeGreaterThan(initial.width);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect.poll(async () => Number(await state.getAttribute('data-width'))).toBeCloseTo(initial.width, 4);
});
