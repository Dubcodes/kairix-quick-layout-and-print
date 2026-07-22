export type Orientation = 'portrait' | 'landscape';
export type DisplayUnit = 'mm' | 'in';
export type PaperPresetId = 'a4' | 'a5' | 'a3' | 'letter' | '4x6' | '5x7' | 'custom';
export type ImageFit = 'fit' | 'fill';
export type OverlapMode = 'off' | 'corners';

export interface PhysicalSize {
  widthMm: number;
  heightMm: number;
}

export interface PaperSettings extends PhysicalSize {
  presetId: PaperPresetId;
  orientation: Orientation;
  units: DisplayUnit;
  safeMarginMm: number;
  background: '#ffffff';
}

export interface ExportSettings {
  dpi: number;
  format: 'png';
}

export interface NormalizedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlacedImage {
  id: string;
  sourceId: string;
  frame: NormalizedRect;
  rotation: 0 | 90 | 180 | 270;
  fit: ImageFit;
  crop: null;
  locked: false;
  autoLayoutEligible: true;
}

export interface ImageAsset {
  id: string;
  name: string;
  file: File;
  objectUrl: string;
  image: HTMLImageElement;
  widthPx: number;
  heightPx: number;
}

export interface PageModel {
  paper: PaperSettings;
  export: ExportSettings;
  arrange: {
    overlap: OverlapMode;
    layoutSeed: number;
  };
  images: PlacedImage[];
}

export interface CalibrationLayout {
  paper: PaperSettings;
  square: { xMm: number; yMm: number; sizeMm: 100 };
  horizontalRuler: { xMm: number; yMm: number; lengthMm: 100 };
  verticalRuler: { xMm: number; yMm: number; lengthMm: 100 };
}

export interface StoredPreferences {
  paperPresetId: PaperPresetId;
  customWidthMm: number;
  customHeightMm: number;
  orientation: Orientation;
  units: DisplayUnit;
  dpi: number;
}
