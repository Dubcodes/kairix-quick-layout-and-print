import { describe, expect, it } from 'vitest';
import { calculateImageDraw, clampNormalizedRect, reframeImagesForPaper, rotatePlacedImage90 } from '../../src/utils/imageGeometry';
import type { PlacedImage } from '../../src/models/types';

describe('image frame geometry', () => {
  it('fits an image without cropping', () => {
    const draw = calculateImageDraw(400, 200, 200, 200, 'fit');
    expect(draw).toMatchObject({ dx: 0, dy: 50, dw: 200, dh: 100, sw: 400, sh: 200 });
  });

  it('fills a frame with a centred crop', () => {
    const draw = calculateImageDraw(400, 200, 200, 200, 'fill');
    expect(draw).toMatchObject({ sx: 100, sy: 0, sw: 200, sh: 200, dw: 200, dh: 200 });
  });

  it('keeps normalized geometry on the page', () => {
    expect(clampNormalizedRect({ x: -.2, y: .9, width: .4, height: .3 })).toEqual({ x: 0, y: .7, width: .4, height: .3 });
  });

  const placed: PlacedImage = {
    id: 'placed', sourceId: 'source', frame: { x: .2, y: .25, width: .3, height: .2 },
    rotation: 0, fit: 'fit', crop: null, locked: false, autoLayoutEligible: true,
  };

  it('preserves physical image size across paper changes', () => {
    const [reframed] = reframeImagesForPaper([placed], { widthMm: 210, heightMm: 297 }, { widthMm: 297, heightMm: 210 });
    expect(reframed.frame.width * 297).toBeCloseTo(placed.frame.width * 210);
    expect(reframed.frame.height * 210).toBeCloseTo(placed.frame.height * 297);
    expect(reframed.frame.x + reframed.frame.width / 2).toBeCloseTo(placed.frame.x + placed.frame.width / 2);
  });

  it('rotates a placement by exactly 90 degrees and swaps its physical dimensions', () => {
    const rotated = rotatePlacedImage90(placed, { widthMm: 210, heightMm: 297 });
    expect(rotated.rotation).toBe(90);
    expect(rotated.frame.width * 210).toBeCloseTo(placed.frame.height * 297);
    expect(rotated.frame.height * 297).toBeCloseTo(placed.frame.width * 210);
  });
});
