import type { DisplayUnit, Orientation, PaperPresetId, PaperSettings } from '../models/types';
import { PAPER_PRESETS } from '../utils/paper';
import { displayLength, inputLengthFromMm } from '../utils/units';
import { Icon } from './Icon';
import { Tooltip } from './Tooltip';
import { SafeImage } from './BrandingAssets';
import { APP_NAME, APP_VERSION, PROJECT_URL } from '../models/appMetadata';

interface Props {
  paper: PaperSettings;
  dpi: number;
  outputPixels: { width: number; height: number };
  exporting: boolean;
  printing: boolean;
  onPresetChange: (preset: PaperPresetId) => void;
  onOrientationChange: (orientation: Orientation) => void;
  onUnitsChange: (units: DisplayUnit) => void;
  onCustomSizeChange: (axis: 'width' | 'height', displayValue: number) => void;
  onDpiChange: (dpi: number) => void;
  onExport: () => void;
  onPrint: () => void;
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
        <Tooltip content={props.calibrationMode ? 'The calibration sheet always uses A4 paper.' : 'Choose a preset or enter a custom physical paper size.'} disabled={props.calibrationMode}>
          <select id="paper-preset" value={props.paper.presetId} disabled={props.calibrationMode} onChange={(event) => props.onPresetChange(event.target.value as PaperPresetId)}>
            {PAPER_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
            <option value="custom">Custom size</option>
          </select>
        </Tooltip>
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
          <Tooltip content={props.calibrationMode ? 'The calibration sheet remains portrait.' : 'Use the paper with its shorter edge across the top.'} disabled={props.calibrationMode}><button type="button" aria-pressed={props.paper.orientation === 'portrait'} className={props.paper.orientation === 'portrait' ? 'active' : ''} disabled={props.calibrationMode} onClick={() => props.onOrientationChange('portrait')}>Portrait</button></Tooltip>
          <Tooltip content={props.calibrationMode ? 'The calibration sheet remains portrait.' : 'Rotate the paper so its longer edge is across the top.'} disabled={props.calibrationMode}><button type="button" aria-pressed={props.paper.orientation === 'landscape'} className={props.paper.orientation === 'landscape' ? 'active' : ''} disabled={props.calibrationMode} onClick={() => props.onOrientationChange('landscape')}>Landscape</button></Tooltip>
        </div>
      </div>

      <div className="settings-row">
        <div className="field-group">
          <label>Units</label>
          <div className="segmented-control segmented-control--small">
            <Tooltip content={props.calibrationMode ? 'Calibration measurements are fixed in millimetres.' : 'Display physical dimensions in millimetres.'} disabled={props.calibrationMode}><button type="button" aria-pressed={props.paper.units === 'mm'} className={props.paper.units === 'mm' ? 'active' : ''} disabled={props.calibrationMode} onClick={() => props.onUnitsChange('mm')}>mm</button></Tooltip>
            <Tooltip content={props.calibrationMode ? 'Calibration measurements are fixed in millimetres.' : 'Display physical dimensions in inches.'} disabled={props.calibrationMode}><button type="button" aria-pressed={props.paper.units === 'in'} className={props.paper.units === 'in' ? 'active' : ''} disabled={props.calibrationMode} onClick={() => props.onUnitsChange('in')}>in</button></Tooltip>
          </div>
        </div>
        <div className="field-group">
          <label htmlFor="dpi">Resolution</label>
          <Tooltip content={props.calibrationMode ? 'Calibration export is fixed at 300 DPI.' : 'DPI controls export pixel dimensions; 300 DPI is recommended for high-quality printing.'} disabled={props.calibrationMode}>
            <select id="dpi" value={props.dpi} disabled={props.calibrationMode} onChange={(event) => props.onDpiChange(Number(event.target.value))}>{[150, 200, 300, 600].map((dpi) => <option key={dpi} value={dpi}>{dpi} DPI</option>)}</select>
          </Tooltip>
        </div>
      </div>

      <div className="field-group">
        <label>Format</label>
        <div className="format-list">
          <Tooltip content="PNG is the available lossless export format and includes physical-resolution metadata."><label className="format-option active" tabIndex={0}><input type="radio" checked readOnly /> PNG <span>Recommended</span></label></Tooltip>
          <label className="format-option disabled"><input type="radio" disabled /> JPEG <span>Coming later</span></label>
          <label className="format-option disabled"><input type="radio" disabled /> PDF <span>Coming later</span></label>
        </div>
      </div>

      <div className="export-summary">
        <span>Final PNG</span>
        <strong data-testid="pixel-dimensions">{props.outputPixels.width.toLocaleString()} × {props.outputPixels.height.toLocaleString()} px</strong>
        <small>White background · 5 mm safe margin · {props.dpi} DPI metadata</small>
      </div>

      <details className="about-links">
        <summary>About &amp; links</summary>
        <div className="about-links__content">
          <SafeImage className="dubcodes-logo" src="/assets/dubcodes_media_logo.png" alt="Dubcodes Media" />
          <strong>{APP_NAME}</strong>
          <span>Version {APP_VERSION}</span>
          <a href={PROJECT_URL} target="_blank" rel="noopener noreferrer">View the official project page</a>
        </div>
      </details>
      </div>

      <div className="settings-actions">
        <div className="output-actions">
          <Tooltip content={props.printing ? 'The print page is being prepared locally.' : 'Open your device’s print dialog.'} disabled={props.printing || props.exporting}>
            <button className="print-button" type="button" disabled={props.printing || props.exporting} onClick={props.onPrint}><Icon name="print" />{props.printing ? 'Preparing…' : 'Print'}</button>
          </Tooltip>
          <Tooltip content={props.exporting ? 'Please wait while the full-resolution PNG is rendered locally.' : 'Render and download the exact-size PNG locally using original image data.'} disabled={props.exporting || props.printing}>
            <button className="export-button" type="button" disabled={props.exporting || props.printing} onClick={props.onExport}><Icon name="download" />{props.exporting ? 'Rendering…' : props.calibrationMode ? 'Export calibration PNG' : 'Export PNG'}</button>
          </Tooltip>
        </div>
        <p className="print-guidance">Use Actual Size or 100% if your printer dialog offers scaling options.</p>
        {!props.calibrationMode && <Tooltip content="Restore A4, portrait, millimetres, 300 DPI, PNG, white background, 5 mm margin and Overlap Off."><button className="restore-button" type="button" onClick={props.onRestoreDefaults}>Restore Recommended Defaults</button></Tooltip>}
      </div>
    </aside>
  );
}
