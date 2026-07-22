import { describe, expect, it } from 'vitest';
import { getOrientedPaperSize, getPaperPreset, orientSize, PAPER_PRESETS } from '../../src/utils/paper';

describe('paper presets', () => {
  const expected = {
    a4: [210, 297],
    a5: [148, 210],
    a3: [297, 420],
    letter: [215.9, 279.4],
    '4x6': [101.6, 152.4],
    '5x7': [127, 177.8],
  } as const;

  it.each(PAPER_PRESETS)('$label has the expected dimensions', (preset) => {
    expect([preset.widthMm, preset.heightMm]).toEqual(expected[preset.id]);
    expect(getPaperPreset(preset.id)).toEqual(preset);
  });

  it('switches a size between portrait and landscape', () => {
    expect(orientSize({ widthMm: 210, heightMm: 297 }, 'portrait')).toEqual({ widthMm: 210, heightMm: 297 });
    expect(orientSize({ widthMm: 210, heightMm: 297 }, 'landscape')).toEqual({ widthMm: 297, heightMm: 210 });
    expect(orientSize({ widthMm: 297, heightMm: 210 }, 'portrait')).toEqual({ widthMm: 210, heightMm: 297 });
  });

  it('applies orientation to every included preset', () => {
    for (const preset of PAPER_PRESETS) {
      const portrait = getOrientedPaperSize(preset.id, 'portrait');
      const landscape = getOrientedPaperSize(preset.id, 'landscape');
      expect(portrait.widthMm).toBeLessThan(portrait.heightMm);
      expect(landscape.widthMm).toBeGreaterThan(landscape.heightMm);
      expect(landscape.widthMm).toBe(portrait.heightMm);
      expect(landscape.heightMm).toBe(portrait.widthMm);
    }
  });
});
