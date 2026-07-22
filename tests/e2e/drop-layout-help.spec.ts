import { expect, test, type Page } from '@playwright/test';
import { imageFixtures } from '../fixtures/images';

interface DropFile {
  name: string;
  mimeType: string;
  base64: string;
}

const validFiles: DropFile[] = imageFixtures.map((fixture) => ({
  name: fixture.name,
  mimeType: fixture.mimeType,
  base64: fixture.buffer.toString('base64'),
}));

async function createDataTransfer(page: Page, files: DropFile[]) {
  return page.evaluateHandle((payloads) => {
    const transfer = new DataTransfer();
    for (const payload of payloads) {
      const binary = atob(payload.base64);
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      transfer.items.add(new File([bytes], payload.name, { type: payload.mimeType }));
    }
    return transfer;
  }, files);
}

async function dropFiles(page: Page, target: ReturnType<Page['locator']>, files: DropFile[]) {
  const dataTransfer = await createDataTransfer(page, files);
  await target.dispatchEvent('dragenter', { dataTransfer });
  await target.dispatchEvent('dragover', { dataTransfer });
  await target.dispatchEvent('drop', { dataTransfer });
  await dataTransfer.dispose();
}

interface Frame {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

async function frames(page: Page): Promise<Frame[]> {
  return page.getByTestId('placed-photo').evaluateAll((elements) => elements.map((element) => ({
    id: element.getAttribute('data-image-id') ?? '',
    x: Number(element.getAttribute('data-x')),
    y: Number(element.getAttribute('data-y')),
    width: Number(element.getAttribute('data-width')),
    height: Number(element.getAttribute('data-height')),
  })));
}

function expectNoIntersections(items: Frame[]) {
  for (let first = 0; first < items.length; first += 1) {
    for (let second = first + 1; second < items.length; second += 1) {
      const a = items[first];
      const b = items[second];
      const intersects = a.x < b.x + b.width - 0.00001
        && a.x + a.width > b.x + 0.00001
        && a.y < b.y + b.height - 0.00001
        && a.y + a.height > b.y + 0.00001;
      expect(intersects).toBe(false);
    }
  }
}

test('Photos panel accepts mixed drops, highlights the app and preserves valid files', async ({ page }) => {
  await page.goto('/');
  const photos = page.getByRole('region', { name: 'Photos' });
  const dataTransfer = await createDataTransfer(page, [
    validFiles[0],
    { name: 'notes.txt', mimeType: 'text/plain', base64: Buffer.from('not an image').toString('base64') },
  ]);
  await photos.dispatchEvent('dragenter', { dataTransfer });
  await expect(page.getByText('Drop photos to add them', { exact: true })).toBeVisible();
  await photos.dispatchEvent('dragover', { dataTransfer });
  await photos.dispatchEvent('drop', { dataTransfer });
  await dataTransfer.dispose();
  await expect(page.getByTestId('placed-photo')).toHaveCount(1);
  await expect(page.getByRole('alert')).toContainText('only JPEG, PNG and WebP images are supported');
});

test('page workspace and paper preview drop initially arrange photos within safe margins without intersections', async ({ page }) => {
  await page.goto('/');
  await dropFiles(page, page.locator('.page-shadow'), validFiles);
  await expect(page.getByTestId('placed-photo')).toHaveCount(3);
  const placed = await frames(page);
  expectNoIntersections(placed);
  for (const frame of placed) {
    expect(frame.x).toBeGreaterThanOrEqual(5 / 210 - 0.00001);
    expect(frame.y).toBeGreaterThanOrEqual(5 / 297 - 0.00001);
    expect(frame.x + frame.width).toBeLessThanOrEqual(1 - 5 / 210 + 0.00001);
    expect(frame.y + frame.height).toBeLessThanOrEqual(1 - 5 / 297 + 0.00001);
  }
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByTestId('placed-photo')).toHaveCount(0);
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect(page.getByTestId('placed-photo')).toHaveCount(3);
});

test('additional imports preserve an existing photo and avoid overlap', async ({ page }) => {
  await page.goto('/');
  await page.locator('input[type="file"]').setInputFiles([imageFixtures[0]]);
  await expect(page.getByTestId('placed-photo')).toHaveCount(1);
  const before = (await frames(page))[0];
  await dropFiles(page, page.getByRole('region', { name: 'Photos' }), validFiles.slice(1));
  await expect(page.getByTestId('placed-photo')).toHaveCount(3);
  const after = await frames(page);
  expect(after.find((frame) => frame.id === before.id)).toEqual(before);
  expectNoIntersections(after);
});

test('file drops are cancelled so the browser does not navigate to dropped files', async ({ page }) => {
  await page.goto('/');
  const before = page.url();
  const prevented = await page.locator('.app-shell').evaluate((element, payload) => {
    const transfer = new DataTransfer();
    const bytes = Uint8Array.from(atob(payload.base64), (character) => character.charCodeAt(0));
    transfer.items.add(new File([bytes], payload.name, { type: payload.mimeType }));
    const event = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer });
    element.dispatchEvent(event);
    return event.defaultPrevented;
  }, validFiles[0]);
  expect(prevented).toBe(true);
  expect(page.url()).toBe(before);
  await expect(page.getByTestId('placed-photo')).toHaveCount(1);
});

test('Auto Arrange is explained when disabled and produces different undoable valid layouts', async ({ page }) => {
  await page.goto('/');
  const arrange = page.getByRole('button', { name: 'Auto Arrange', exact: true });
  await expect(arrange).toBeDisabled();
  await arrange.hover();
  const disabledExplanation = page.getByText('Add at least one photo before using Auto Arrange.', { exact: true });
  await expect(disabledExplanation).toBeVisible();
  await page.mouse.move(0, 0);
  await arrange.evaluate((button) => (button.parentElement as HTMLElement).focus());
  await expect(disabledExplanation).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles(imageFixtures);
  await expect(arrange).toBeEnabled();
  await arrange.click();
  const first = await frames(page);
  expectNoIntersections(first);
  await arrange.click();
  const second = await frames(page);
  expectNoIntersections(second);
  expect(second).not.toEqual(first);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  expect(await frames(page)).toEqual(first);
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  expect(await frames(page)).toEqual(second);
});

test('tooltips support hover and keyboard focus', async ({ page }) => {
  await page.goto('/');
  const add = page.getByRole('button', { name: 'Add photos', exact: true });
  const explanation = page.getByText('Choose JPEG, PNG or WebP photos from this device.', { exact: true });
  await add.hover();
  await expect(explanation).toBeVisible();
  await add.focus();
  await expect(explanation).toBeVisible();
});

test('help hash route loads and returns to the editor', async ({ page }) => {
  await page.goto('/#/help');
  await expect(page.getByRole('heading', { name: 'Help with layout and printing' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Auto Arrange' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => window.innerWidth));
  const hero = page.locator('.help-hero');
  await hero.getByRole('link', { name: 'Return to editor', exact: true }).click();
  await expect(page.getByTestId('canvas-workspace')).toBeVisible();
  expect(page.url()).toContain('#/');
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
    window.location.hash = '#/help';
  });
  await expect(page.getByRole('heading', { name: 'Help with layout and printing' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});
