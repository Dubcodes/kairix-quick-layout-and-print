import { describe, expect, it } from 'vitest';
import { addPngPhysicalResolution } from '../../src/features/export/pngMetadata';

describe('PNG physical resolution metadata', () => {
  it('inserts a pHYs chunk with pixels per metre', () => {
    const minimalHeader = Uint8Array.from([
      137, 80, 78, 71, 13, 10, 26, 10,
      0, 0, 0, 13, 73, 72, 68, 82,
      0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 0, 0, 0, 0,
    ]);
    const output = new Uint8Array(addPngPhysicalResolution(minimalHeader.buffer, 300));
    expect(new TextDecoder().decode(output.slice(37, 41))).toBe('pHYs');
    expect(new DataView(output.buffer).getUint32(41, false)).toBe(11811);
    expect(output[49]).toBe(1);
  });
});
