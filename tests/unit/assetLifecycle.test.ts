import { describe, expect, it } from 'vitest';
import { referencedSourceIds } from '../../src/features/import/assetLifecycle';
import type { PageModel, PlacedImage } from '../../src/models/types';
import { paperSettingsFromPreferences, RECOMMENDED_PREFERENCES } from '../../src/models/defaults';

const image = (id: string, sourceId: string): PlacedImage => ({
  id, sourceId, frame: { x: .1, y: .1, width: .2, height: .2 }, rotation: 0,
  fit: 'fit', crop: null, locked: false, autoLayoutEligible: true,
});
const page = (images: PlacedImage[]): PageModel => ({
  paper: paperSettingsFromPreferences(RECOMMENDED_PREFERENCES), export: { dpi: 300, format: 'png' },
  arrange: { overlap: 'off', layoutSeed: 0 }, images,
});

describe('temporary image asset lifecycle', () => {
  it('retains assets needed by undo or redo and releases obsolete sources', () => {
    expect([...referencedSourceIds([page([image('a', 'source-a')]), page([]), page([image('b', 'source-b')])])]).toEqual(['source-a', 'source-b']);
    expect(referencedSourceIds([page([])]).has('source-a')).toBe(false);
  });
});
