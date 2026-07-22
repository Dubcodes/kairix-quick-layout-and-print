import { describe, expect, it } from 'vitest';
import { createCalibrationLayout, createCalibrationPaper } from '../../src/features/calibration/calibration';

describe('print calibration layout', () => {
  it('uses recommended A4 portrait settings and exact 100 mm measures', () => {
    const paper = createCalibrationPaper();
    const layout = createCalibrationLayout(paper);
    expect(paper).toMatchObject({ widthMm: 210, heightMm: 297, orientation: 'portrait', safeMarginMm: 5, background: '#ffffff' });
    expect(layout.square.sizeMm).toBe(100);
    expect(layout.horizontalRuler.lengthMm).toBe(100);
    expect(layout.verticalRuler.lengthMm).toBe(100);
  });
});
