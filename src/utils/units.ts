import type { DisplayUnit, PhysicalSize } from '../models/types';

export const MILLIMETRES_PER_INCH = 25.4;

export function mmToPixels(mm: number, dpi: number): number {
  return Math.round((mm / MILLIMETRES_PER_INCH) * dpi);
}

export function inchesToPixels(inches: number, dpi: number): number {
  return Math.round(inches * dpi);
}

export function mmToInches(mm: number): number {
  return mm / MILLIMETRES_PER_INCH;
}

export function inchesToMm(inches: number): number {
  return inches * MILLIMETRES_PER_INCH;
}

export function paperPixelSize(size: PhysicalSize, dpi: number): { width: number; height: number } {
  return { width: mmToPixels(size.widthMm, dpi), height: mmToPixels(size.heightMm, dpi) };
}

export function displayLength(mm: number, units: DisplayUnit): string {
  return units === 'mm' ? `${round(mm, 1)} mm` : `${round(mmToInches(mm), 2)} in`;
}

export function inputLengthFromMm(mm: number, units: DisplayUnit): number {
  return units === 'mm' ? round(mm, 1) : round(mmToInches(mm), 2);
}

export function inputLengthToMm(value: number, units: DisplayUnit): number {
  return units === 'mm' ? value : inchesToMm(value);
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
