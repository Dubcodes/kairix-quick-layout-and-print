import type { ExportSettings, PaperSettings, StoredPreferences } from './types';
import { getOrientedPaperSize } from '../utils/paper';

export const RECOMMENDED_PREFERENCES: StoredPreferences = {
  paperPresetId: 'a4',
  customWidthMm: 210,
  customHeightMm: 297,
  orientation: 'portrait',
  units: 'mm',
  dpi: 300,
};

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  dpi: 300,
  format: 'png',
};

export function paperSettingsFromPreferences(preferences: StoredPreferences): PaperSettings {
  const size = getOrientedPaperSize(
    preferences.paperPresetId,
    preferences.orientation,
    preferences.paperPresetId === 'custom'
      ? { widthMm: preferences.customWidthMm, heightMm: preferences.customHeightMm }
      : undefined,
  );

  return {
    presetId: preferences.paperPresetId,
    orientation: preferences.orientation,
    units: preferences.units,
    safeMarginMm: 5,
    background: '#ffffff',
    ...size,
  };
}
