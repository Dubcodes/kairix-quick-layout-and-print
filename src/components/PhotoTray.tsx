import type { ImageAsset, PaperSettings, PlacedImage } from '../models/types';
import { effectivePrintPpi } from '../utils/imageGeometry';
import { Icon } from './Icon';

interface Props {
  images: PlacedImage[];
  assets: Map<string, ImageAsset>;
  paper: PaperSettings;
  targetDpi: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onFitChange: (fit: 'fit' | 'fill') => void;
}

export function PhotoTray({ images, assets, paper, targetDpi, selectedId, onSelect, onFitChange }: Props) {
  const selected = images.find((image) => image.id === selectedId);
  const selectedAsset = selected ? assets.get(selected.sourceId) : undefined;
  return (
    <section className="asset-panel panel-card" aria-labelledby="photos-heading">
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
              <button
                key={placed.id}
                className={`thumbnail-button ${placed.id === selectedId ? 'is-selected' : ''}`}
                type="button"
                onClick={() => onSelect(placed.id)}
                aria-label={`Select ${asset.name}`}
                data-testid="placed-photo"
              >
                <img src={asset.objectUrl} alt="" />
                <span>{index + 1}</span>
                {lowResolution && <i title={`${ppi} effective PPI`}>!</i>}
              </button>
            );
          })}
        </div>
      )}

      <div className="field-group compact-field">
        <label>Image sizing</label>
        <div className="segmented-control">
          <button type="button" aria-pressed={selected?.fit === 'fit'} className={selected?.fit === 'fit' ? 'active' : ''} disabled={!selected} onClick={() => onFitChange('fit')}>Fit</button>
          <button type="button" aria-pressed={selected?.fit === 'fill'} className={selected?.fit === 'fill' ? 'active' : ''} disabled={!selected} onClick={() => onFitChange('fill')}>Fill</button>
        </div>
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
        <div className="quality-warning" role="status">
          <strong>Print quality warning</strong>
          <span>
            This placement provides about {effectivePrintPpi(selected, selectedAsset, paper)} PPI, below the {targetDpi} DPI output target. Reduce its size for sharper printing. Export remains available.
          </span>
        </div>
      )}
    </section>
  );
}
