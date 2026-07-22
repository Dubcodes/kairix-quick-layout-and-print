import { describe, expect, it } from 'vitest';
import { buildPrintDocumentMarkup, createPrintPlan } from '../../src/features/print/printDocument';
import { paperSettingsFromPreferences, RECOMMENDED_PREFERENCES } from '../../src/models/defaults';
import type { PageModel, PlacedImage } from '../../src/models/types';

const placed = (id: string, rotation: PlacedImage['rotation'], fit: PlacedImage['fit'], frame: PlacedImage['frame']): PlacedImage => ({
  id,
  sourceId: `source-${id}`,
  frame,
  rotation,
  fit,
  crop: null,
  locked: false,
  autoLayoutEligible: true,
});

const page = (): PageModel => ({
  paper: paperSettingsFromPreferences(RECOMMENDED_PREFERENCES),
  export: { dpi: 300, format: 'png' },
  arrange: { overlap: 'off', layoutSeed: 0 },
  images: [
    placed('back', 90, 'fill', { x: .07, y: .11, width: .36, height: .29 }),
    placed('front', 270, 'fit', { x: .48, y: .52, width: .41, height: .34 }),
  ],
});

describe('isolated print document', () => {
  it('uses A4 portrait physical dimensions and contains only the rendered page image', () => {
    const plan = createPrintPlan(page());
    const markup = buildPrintDocumentMarkup(plan);
    expect(plan).toMatchObject({ widthMm: 210, heightMm: 297, orientation: 'portrait', dpi: 300 });
    expect(markup).toContain('@page { size: 210mm 297mm; margin: 0; }');
    expect(markup).toContain('<body><img id="kairix-print-image" alt=""></body>');
    expect(markup.match(/<img\b/g)).toHaveLength(1);
    expect(markup).not.toMatch(/toolbar|settings-panel|safe-margin|selection|footer|tooltip/i);
  });

  it('uses landscape dimensions selected by the page model', () => {
    const model = page();
    model.paper = { ...model.paper, orientation: 'landscape', widthMm: 297, heightMm: 210 };
    const plan = createPrintPlan(model);
    expect(plan).toMatchObject({ widthMm: 297, heightMm: 210, orientation: 'landscape' });
    expect(buildPrintDocumentMarkup(plan)).toContain('@page { size: 297mm 210mm; margin: 0; }');
  });

  it('uses exact custom paper dimensions', () => {
    const model = page();
    model.paper = { ...model.paper, presetId: 'custom', widthMm: 176.4, heightMm: 231.8 };
    const plan = createPrintPlan(model);
    expect(plan.widthMm).toBe(176.4);
    expect(plan.heightMm).toBe(231.8);
    expect(buildPrintDocumentMarkup(plan)).toContain('@page { size: 176.4mm 231.8mm; margin: 0; }');
  });

  it('retains physical geometry, rotation, fit mode and layer order', () => {
    expect(createPrintPlan(page()).placements).toEqual([
      { id: 'back', sourceId: 'source-back', frame: { x: .07, y: .11, width: .36, height: .29 }, rotation: 90, fit: 'fill', crop: null, layer: 0 },
      { id: 'front', sourceId: 'source-front', frame: { x: .48, y: .52, width: .41, height: .34 }, rotation: 270, fit: 'fit', crop: null, layer: 1 },
    ]);
  });
});
