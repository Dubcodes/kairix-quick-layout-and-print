import { BrandMark } from './BrandMark';
import { Icon } from './Icon';
import { COFFEE_URL, PROJECT_URL } from '../models/appMetadata';

export function HelpPage() {
  return (
    <div className="help-shell">
      <header className="app-header">
        <a className="brand" href="#/" aria-label="Return to Kairix editor"><BrandMark /><span><strong>Kairix</strong> Quick Layout & Print</span></a>
        <div className="privacy-pill"><Icon name="shield" /><span><strong>Your photos stay on this device.</strong><span className="privacy-detail"> Processed locally, never uploaded.</span></span></div>
      </header>
      <main className="help-page">
        <div className="help-hero">
          <p className="eyebrow">Guide</p>
          <h1>Help with layout and printing</h1>
          <p>Build and print a precise page locally without uploading your photos.</p>
          <a className="help-return" href="#/">Return to editor</a>
        </div>
        <div className="help-grid">
          <section><h2>Quick start</h2><ol><li>Add or drop JPEG, PNG or WebP photos.</li><li>Use the initial placement or press Auto Arrange.</li><li>Choose paper, orientation and DPI.</li><li>Choose Print or Export PNG.</li></ol></section>
          <section><h2>Adding and dropping photos</h2><p>Use Add photos, or drop files onto the Photos panel, workspace or paper preview. Valid photos in a mixed batch are still imported; unsupported files are reported separately.</p></section>
          <section><h2>Select and edit</h2><p>Select a thumbnail or photo. Drag to move, use the corner handles to resize, and use Rotate, Duplicate or Delete in the toolbar. Every completed action can be undone and redone.</p></section>
          <section><h2>Fit versus Fill</h2><p><strong>Fit</strong> shows the complete photo and is used by automatic layouts. <strong>Fill</strong> covers the frame by applying a centred crop; the original source remains unchanged.</p></section>
          <section><h2>Initial placement and Auto Arrange</h2><p>A batch added to an empty page is arranged inside the safe margin with physical gutters. New batches first use available space around existing photos. Auto Arrange evaluates several seeded candidates and chooses a balanced layout; each press creates a different undoable result.</p></section>
          <section><h2>Overlap</h2><p><strong>Off</strong> is recommended and prevents photo rectangles from intersecting. <strong>Corners</strong> permits only small corner overlaps of approximately 5 mm or less and keeps important central regions clear.</p></section>
          <section><h2>Paper and orientation</h2><p>Choose a preset or custom physical size, then select portrait or landscape. Page geometry is stored independently from screen pixels, so responsive preview sizing does not change the printed layout.</p></section>
          <section><h2>DPI and print quality</h2><p>300 DPI is recommended. A warning appears when a placement asks for more detail than the source photo provides. The warning does not block export; reducing that photo’s print size improves sharpness.</p></section>
          <section><h2>Print or Export PNG</h2><p><strong>Print</strong> prepares an isolated, full-resolution page from the original photos and opens your device’s print dialog. Choose <strong>Actual Size</strong> or <strong>100%</strong> and disable Fit to page or Scale to fit. Printer drivers can still apply scaling. <strong>Export PNG</strong> saves the same exact-size local rendering with physical-resolution metadata and can be more reliable in picky printer applications.</p></section>
          <section><h2>Print calibration</h2><p>Open Print calibration, export its PNG through the normal pipeline, and print at Actual Size or 100%. Measure the 100 mm square and both rulers, then confirm the 5 mm margin indicators.</p></section>
          <section><h2>Privacy and offline use</h2><p>Photos remain in browser memory on this device and are never uploaded. Settings—not photos—are stored locally in IndexedDB. After the app shell has loaded, service-worker caching supports offline use.</p></section>
          <section><h2>Restore defaults</h2><p>Restore Recommended Defaults returns to A4, portrait, millimetres, 300 DPI, PNG, white background, a 5 mm safe margin and Overlap Off.</p></section>
          <section><h2>Official links</h2><p><a href={PROJECT_URL} target="_blank" rel="noopener noreferrer">View the official project page</a> for public information, or <a href={COFFEE_URL} target="_blank" rel="noopener noreferrer">support Dubcodes on Buy Me a Coffee</a>.</p></section>
        </div>
        <a className="help-return help-return--bottom" href="#/">Return to editor</a>
      </main>
    </div>
  );
}
