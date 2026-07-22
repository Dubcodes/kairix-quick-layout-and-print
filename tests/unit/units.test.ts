import { describe, expect, it } from 'vitest';
import { inchesToPixels, mmToPixels, paperPixelSize } from '../../src/utils/units';

describe('physical unit conversion', () => {
  it('converts millimetres to rounded pixels', () => {
    expect(mmToPixels(210, 300)).toBe(2480);
    expect(mmToPixels(297, 300)).toBe(3508);
  });

  it('converts inches to rounded pixels', () => {
    expect(inchesToPixels(4, 300)).toBe(1200);
    expect(inchesToPixels(6, 300)).toBe(1800);
    expect(inchesToPixels(8.5, 300)).toBe(2550);
  });

  it('produces the exact A4 300 DPI dimensions', () => {
    expect(paperPixelSize({ widthMm: 210, heightMm: 297 }, 300)).toEqual({ width: 2480, height: 3508 });
  });
});
