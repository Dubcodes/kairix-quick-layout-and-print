import { describe, expect, it } from 'vitest';
import {
  arrangementSignature,
  createAutoArrangement,
  isArrangementValid,
  isPairPlacementAllowed,
  normalizedToPhysical,
  placeImportedImages,
  type LayoutItem,
} from '../../src/features/layout/autoArrange';
import { paperSettingsFromPreferences, RECOMMENDED_PREFERENCES } from '../../src/models/defaults';
import type { PhysicalSize, PlacedImage } from '../../src/models/types';

const paper = paperSettingsFromPreferences(RECOMMENDED_PREFERENCES);

function item(id: string, aspectRatio: number): LayoutItem {
  return {
    aspectRatio,
    image: {
      id,
      sourceId: `source-${id}`,
      frame: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
      rotation: 0,
      fit: 'fit',
      crop: null,
      locked: false,
      autoLayoutEligible: true,
    },
  };
}

function frameFromMm(id: string, rect: { x: number; y: number; width: number; height: number }): PlacedImage {
  return {
    ...item(id, rect.width / rect.height).image,
    frame: { x: rect.x / paper.widthMm, y: rect.y / paper.heightMm, width: rect.width / paper.widthMm, height: rect.height / paper.heightMm },
  };
}

function expectInsideSafeArea(image: PlacedImage, size: PhysicalSize & { safeMarginMm: number }) {
  const rect = normalizedToPhysical(image.frame, paper);
  expect(rect.x).toBeGreaterThanOrEqual(size.safeMarginMm - 0.001);
  expect(rect.y).toBeGreaterThanOrEqual(size.safeMarginMm - 0.001);
  expect(rect.x + rect.width).toBeLessThanOrEqual(size.widthMm - size.safeMarginMm + 0.001);
  expect(rect.y + rect.height).toBeLessThanOrEqual(size.heightMm - size.safeMarginMm + 0.001);
}

describe('automatic physical-unit layout', () => {
  it('places a multi-image batch inside safe margins without intersections and preserves aspect ratios', () => {
    const items = [item('a', 1.5), item('b', 0.75), item('c', 1), item('d', 1.8)];
    const result = createAutoArrangement(items, paper, 'off', 1);
    expect(isArrangementValid(result.images, paper, 'off')).toBe(true);
    for (const image of result.images) {
      expectInsideSafeArea(image, paper);
      const rect = normalizedToPhysical(image.frame, paper);
      const source = items.find((candidate) => candidate.image.id === image.id)!;
      expect(rect.width / rect.height).toBeCloseTo(source.aspectRatio, 5);
      expect(image.fit).toBe('fit');
    }
  });

  it('uses the changing seed to avoid immediately repeating an arrangement', () => {
    const items = [item('a', 1), item('b', 1), item('c', 1)];
    const first = createAutoArrangement(items, paper, 'off', 1);
    const second = createAutoArrangement(items, paper, 'off', 2, first.signature);
    expect(second.signature).not.toBe(first.signature);
    expect(arrangementSignature(second.images)).toBe(second.signature);
  });

  it('preserves existing placement when new photos fit in available space', () => {
    const existingImage = frameFromMm('existing', { x: 8, y: 8, width: 60, height: 40 });
    const existing = [{ image: existingImage, aspectRatio: 1.5 }];
    const result = placeImportedImages(existing, [item('new-a', 1), item('new-b', 0.75)], paper, 'off', 3);
    expect(result.images.find((image) => image.id === 'existing')?.frame).toEqual(existingImage.frame);
    expect(isArrangementValid(result.images, paper, 'off')).toBe(true);
  });

  it('allows only small corner overlap and rejects central coverage', () => {
    const first = normalizedToPhysical(frameFromMm('a', { x: 10, y: 10, width: 50, height: 50 }).frame, paper);
    const corner = normalizedToPhysical(frameFromMm('b', { x: 58, y: 58, width: 50, height: 50 }).frame, paper);
    const central = normalizedToPhysical(frameFromMm('c', { x: 45, y: 45, width: 50, height: 50 }).frame, paper);
    expect(isPairPlacementAllowed(first, corner, 'corners')).toBe(true);
    expect(isPairPlacementAllowed(first, corner, 'off')).toBe(false);
    expect(isPairPlacementAllowed(first, central, 'corners')).toBe(false);
  });
});
