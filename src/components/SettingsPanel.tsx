import type { DisplayUnit, Orientation, PaperPresetId, PaperSettings } from '../models/types';
import { PAPER_PRESETS } from '../utils/paper';
import { displayLength, inputLengthFromMm } from '../utils/units';
import { Icon } from './Icon';

interface Props {
  paper: PaperSettings;
  dpi: number;
  outputPixels: { width: number; height: number };
  exporting: boolean;
  onPresetChange: (preset: PaperPresetId) => void;
  onOrientationChange: (orientation: Orientation) => void;
  onUnitsChange: (units: DisplayUnit) => void;
  onCustomSizeChange: (axis: 'width' | 'height', displayValue: number) => void;
  onDpiChange: (dpi: number) => void;
  onExport: () => void;
  onRestoreDefaults: () => void;
  calibrationMode?: boolean;
}

export function SettingsPanel(props: Props) {
  const unitLabel = props.paper.units === 'mm' ? 'mm' : 'in';
  return (
    <aside className="settings-panel panel-card" aria-labelledby="settings-heading">
      <div className="panel-heading-row">
        <div>
          <p className="eyebrow">3 · Export</p>
          <h2 id="settings-heading">Paper & export</h2>
        </div>
      </div>
      <div className="settings-scroll-area">
        <p className="recommended-line">
        {props.calibrationMode ? 'Calibration standard: A4 · Portrait · 300 DPI · PNG' : 'Recommended defaults: A4 · Portrait · 300 DPI · PNG'}
        </p>

      <div className="field-group">
        <label htmlFor="paper-preset">Paper size</label>
        <select id="paper-preset" value={props.paper.presetId} disabled={props.calibrationMode} onChange={(event) => props.onPresetChange(event.target.value as PaperPresetId)}>
          {PAPER_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
          <option value="custom">Custom size</option>
        </select>
        <span className="field-note">{displayLength(props.paper.widthMm, props.paper.units)} × {displayLength(props.paper.heightMm, props.paper.units)}</span>
      </div>

      {props.paper.presetId === 'custom' && (
        <div className="custom-size-grid">
          <label>
            Width ({unitLabel})
            <input type="number" min="20" step="0.1" value={inputLengthFromMm(props.paper.widthMm, props.paper.units)} onChange={(event) => props.onCustomSizeChange('width', Number(event.target.value))} />
          </label>
          <label>
            Height ({unitLabel})
            <input type="number" min="20" step="0.1" value={inputLengthFromMm(props.paper.heightMm, props.paper.units)} onChange={(event) => props.onCustomSizeChange('height', Number(event.target.value))} />
          </label>
        </div>
      )}

      <div className="field-group">
        <label>Orientation</label>
        <div className="segmented-control">
          <button type="button" aria-pressed={props.paper.orientation === 'portrait'} className={props.paper.orientation === 'portrait' ? 'active' : ''} disabled={props.calibrationMode} onClick={() => props.onOrientationChange('portrait')}>Portrait</button>
          <button type="button" aria-pressed={props.paper.orientation === 'landscape'} className={props.paper.orientation === 'landscape' ? 'active' : ''} disabled={props.calibrationMode} onClick={() => props.onOrientationChange('landscape')}>Landscape</button>
        </div>
      </div>

      <div className="settings-row">
        <div className="field-group">
          <label>Units</label>
          <div className="segmented-control segmented-control--small">
            <button type="button" aria-pressed={props.paper.units === 'mm'} className={props.paper.units === 'mm' ? 'active' : ''} disabled={props.calibrationMode} onClick={() => props.onUnitsChange('mm')}>mm</button>
            <button type="button" aria-pressed={props.paper.units === 'in'} className={props.paper.units === 'in' ? 'active' : ''} disabled={props.calibrationMode} onClick={() => props.onUnitsChange('in')}>in</button>
          </div>
        </div>
        <div className="field-group">
          <label htmlFor="dpi">Resolution</label>
          <select id="dpi" value={props.dpi} disabled={props.calibrationMode} onChange={(event) => props.onDpiChange(Number(event.target.value))}>
            {[150, 200, 300, 600].map((dpi) => <option key={dpi} value={dpi}>{dpi} DPI</option>)}
          </select>
        </div>
      </div>

      <div className="field-group">
        <label>Format</label>
        <div className="format-list">
          <label className="format-option active"><input type="radio" checked readOnly /> PNG <span>Recommended</span></label>
          <label className="format-option disabled"><input type="radio" disabled /> JPEG <span>Coming later</span></label>
          <label className="format-option disabled"><input type="radio" disabled /> PDF <span>Coming later</span></label>
        </div>
      </div>

      <div className="export-summary">
        <span>Final PNG</span>
        <strong data-testid="pixel-dimensions">{props.outputPixels.width.toLocaleString()} × {props.outputPixels.height.toLocaleString()} px</strong>
        <small>White background · 5 mm safe margin · {props.dpi} DPI metadata</small>
      </div>
      </div>

      <div className="settings-actions">
        <button className="export-button" type="button" disabled={props.exporting} onClick={props.onExport}>
          <Icon name="download" />
          {props.exporting ? 'Rendering full resolution…' : props.calibrationMode ? 'Export calibration PNG' : 'Export PNG'}
        </button>
        {!props.calibrationMode && <button className="restore-button" type="button" onClick={props.onRestoreDefaults}>Restore Recommended Defaults</button>}
      </div>
    </aside>
  );
}
