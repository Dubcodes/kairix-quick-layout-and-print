import type { ImageAsset, OverlapMode, PaperSettings, PlacedImage } from '../models/types';
import { effectivePrintPpi } from '../utils/imageGeometry';
import { Icon } from './Icon';
import { Tooltip } from './Tooltip';

interface Props {
  images: PlacedImage[];
  assets: Map<string, ImageAsset>;
  paper: PaperSettings;
  targetDpi: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onFitChange: (fit: 'fit' | 'fill') => void;
  overlap: OverlapMode;
  onOverlapChange: (mode: OverlapMode) => void;
  onDropFiles: (files: File[]) => void;
}

export function PhotoTray({ images, assets, paper, targetDpi, selectedId, onSelect, onFitChange, overlap, onOverlapChange, onDropFiles }: Props) {
  const selected = images.find((image) => image.id === selectedId);
  const selectedAsset = selected ? assets.get(selected.sourceId) : undefined;
  return (
    <section
      className="asset-panel panel-card"
      aria-labelledby="photos-heading"
      data-drop-target="photos"
      onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; }}
      onDrop={(event) => { event.preventDefault(); event.stopPropagation(); onDropFiles(Array.from(event.dataTransfer.files)); }}
    >
      <div className="panel-heading-row">
        <div>
          <p className="eyebrow">2 · Arrange</p>
          <h2 id="photos-heading">Photos</h2>
        </div>
        <span className="count-badge">{images.length}</span>
      </div>

      {images.length === 0 ? (
        <div className="empty-assets">
          <Icon name="image" />
          <p>Add a few photos to begin your page.</p>
        </div>
      ) : (
        <div className="thumbnail-grid">
          {images.map((placed, index) => {
            const asset = assets.get(placed.sourceId);
            if (!asset) return null;
            const ppi = effectivePrintPpi(placed, asset, paper);
            const lowResolution = ppi < targetDpi;
            return (
              <Tooltip key={placed.id} content={lowResolution ? `${asset.name}: about ${ppi} effective PPI. Reduce its print size for sharper output.` : `Select ${asset.name} for sizing and editing controls.`}>
                <button
                  className={`thumbnail-button ${placed.id === selectedId ? 'is-selected' : ''}`}
                  type="button"
                  onClick={() => onSelect(placed.id)}
                  aria-label={`Select ${asset.name}${lowResolution ? `, low resolution at ${ppi} PPI` : ''}`}
                  data-testid="placed-photo"
                  data-image-id={placed.id}
                  data-x={placed.frame.x}
                  data-y={placed.frame.y}
                  data-width={placed.frame.width}
                  data-height={placed.frame.height}
                >
                  <img src={asset.objectUrl} alt="" />
                  <span>{index + 1}</span>
                  {lowResolution && <i aria-hidden="true">!</i>}
                </button>
              </Tooltip>
            );
          })}
        </div>
      )}

      <div className="field-group compact-field">
        <label>Image sizing</label>
        <div className="segmented-control">
          <Tooltip content={selected ? 'Show the whole photo without cropping.' : 'Select a photo before changing its sizing mode.'} disabled={!selected}>
            <button type="button" aria-pressed={selected?.fit === 'fit'} className={selected?.fit === 'fit' ? 'active' : ''} disabled={!selected} onClick={() => onFitChange('fit')}>Fit</button>
          </Tooltip>
          <Tooltip content={selected ? 'Fill the frame by cropping equally from the centre.' : 'Select a photo before changing its sizing mode.'} disabled={!selected}>
            <button type="button" aria-pressed={selected?.fit === 'fill'} className={selected?.fit === 'fill' ? 'active' : ''} disabled={!selected} onClick={() => onFitChange('fill')}>Fill</button>
          </Tooltip>
        </div>
      </div>

      <div className="field-group compact-field">
        <label>Overlap</label>
        <div className="segmented-control">
          <Tooltip content="Recommended. Keep photo rectangles separate with a small gutter where possible.">
            <button type="button" aria-pressed={overlap === 'off'} className={overlap === 'off' ? 'active' : ''} onClick={() => onOverlapChange('off')}>Off</button>
          </Tooltip>
          <Tooltip content="Allow only small corner overlaps up to approximately 5 mm; central regions stay clear.">
            <button type="button" aria-pressed={overlap === 'corners'} className={overlap === 'corners' ? 'active' : ''} onClick={() => onOverlapChange('corners')}>Corners</button>
          </Tooltip>
        </div>
        <span className="field-note">{overlap === 'off' ? 'Recommended · no intersections' : 'Small corner overlaps only · maximum 5 mm'}</span>
      </div>

      {selected && selectedAsset && (
        <p
          className="selection-meta"
          data-testid="selected-photo-state"
          data-x={selected.frame.x}
          data-y={selected.frame.y}
          data-width={selected.frame.width}
          data-height={selected.frame.height}
          data-rotation={selected.rotation}
          data-fit={selected.fit}
        >
          {selectedAsset.name} · {selected.rotation}° · {selected.fit === 'fit' ? 'Fit whole photo' : 'Fill frame'}
        </p>
      )}

      {selected && selectedAsset && effectivePrintPpi(selected, selectedAsset, paper) < targetDpi && (
        <Tooltip content="This warning is advisory. The original image is still used and PNG export remains available.">
          <div className="quality-warning" role="status" tabIndex={0}>
            <strong>Print quality warning</strong>
            <span>This placement provides about {effectivePrintPpi(selected, selectedAsset, paper)} PPI, below the {targetDpi} DPI output target. Reduce its size for sharper printing. Export remains available.</span>
          </div>
        </Tooltip>
      )}
    </section>
  );
}
