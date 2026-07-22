import type { Orientation, PaperPresetId, PhysicalSize } from '../models/types';

export interface PaperPreset extends PhysicalSize {
  id: Exclude<PaperPresetId, 'custom'>;
  label: string;
}

export const PAPER_PRESETS: readonly PaperPreset[] = [
  { id: 'a4', label: 'A4', widthMm: 210, heightMm: 297 },
  { id: 'a5', label: 'A5', widthMm: 148, heightMm: 210 },
  { id: 'a3', label: 'A3', widthMm: 297, heightMm: 420 },
  { id: 'letter', label: 'Letter', widthMm: 215.9, heightMm: 279.4 },
  { id: '4x6', label: '4 × 6 inches', widthMm: 101.6, heightMm: 152.4 },
  { id: '5x7', label: '5 × 7 inches', widthMm: 127, heightMm: 177.8 },
] as const;

export function getPaperPreset(id: Exclude<PaperPresetId, 'custom'>): PaperPreset {
  const preset = PAPER_PRESETS.find((candidate) => candidate.id === id);
  if (!preset) throw new Error(`Unknown paper preset: ${id}`);
  return preset;
}

export function orientSize(size: PhysicalSize, orientation: Orientation): PhysicalSize {
  const short = Math.min(size.widthMm, size.heightMm);
  const long = Math.max(size.widthMm, size.heightMm);
  return orientation === 'portrait'
    ? { widthMm: short, heightMm: long }
    : { widthMm: long, heightMm: short };
}

export function getOrientedPaperSize(
  id: PaperPresetId,
  orientation: Orientation,
  customSize?: PhysicalSize,
): PhysicalSize {
  const base = id === 'custom' ? customSize : getPaperPreset(id);
  if (!base) throw new Error('Custom paper requires a width and height.');
  return orientSize(base, orientation);
}
