import { describe, expect, it } from 'vitest';
import { pushHistory, redoHistory, undoHistory, type HistoryState } from '../../src/hooks/useHistory';
import type { PlacedImage } from '../../src/models/types';

const base: PlacedImage = {
  id: 'image', sourceId: 'source', frame: { x: .1, y: .1, width: .25, height: .2 },
  rotation: 0, fit: 'fit', crop: null, locked: false, autoLayoutEligible: true,
};

describe('editor history snapshots', () => {
  it('restores position, dimensions, rotation, fit, duplication and deletion', () => {
    let history: HistoryState<PlacedImage[]> = { past: [], present: [base], future: [] };
    const transformed = { ...base, frame: { x: .3, y: .2, width: .4, height: .35 }, rotation: 90 as const, fit: 'fill' as const };
    history = pushHistory(history, [transformed]);
    const duplicate = { ...transformed, id: 'copy' };
    history = pushHistory(history, [transformed, duplicate]);
    history = pushHistory(history, [duplicate]);

    history = undoHistory(history);
    expect(history.present).toEqual([transformed, duplicate]);
    history = undoHistory(history);
    expect(history.present).toEqual([transformed]);
    history = undoHistory(history);
    expect(history.present).toEqual([base]);

    history = redoHistory(redoHistory(redoHistory(history)));
    expect(history.present).toEqual([duplicate]);
  });
});
