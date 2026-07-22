import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrandMark } from './components/BrandMark';
import { CoffeeSupportLink } from './components/BrandingAssets';
import { EditorToolbar } from './components/EditorToolbar';
import { Icon } from './components/Icon';
import { HelpPage } from './components/HelpPage';
import { PhotoTray } from './components/PhotoTray';
import { SettingsPanel } from './components/SettingsPanel';
import { CanvasEditor } from './features/canvas/CanvasEditor';
import { downloadExport, renderPageToPng } from './features/export/exportRenderer';
import { importImageFile } from './features/import/importImages';
import { dataTransferHasFiles, dataTransferHasSupportedImage, isInteractiveDropTarget } from './features/import/dropFiles';
import { arrangementSignature, createAutoArrangement, isArrangementValid, isPlacementAllowed, placeImportedImages, type LayoutItem } from './features/layout/autoArrange';
import { printPage } from './features/print/printDocument';
import { referencedSourceIds } from './features/import/assetLifecycle';
import { useHistory } from './hooks/useHistory';
import { paperSettingsFromPreferences, RECOMMENDED_PREFERENCES } from './models/defaults';
import type { DisplayUnit, ImageAsset, ImageFit, Orientation, OverlapMode, PageModel, PaperPresetId, PlacedImage, StoredPreferences } from './models/types';
import { loadPreferences, restoreRecommendedPreferences, savePreferences } from './storage/preferences';
import { clampNormalizedRect } from './utils/imageGeometry';
import { reframeImagesForPaper, rotatePlacedImage90 } from './utils/imageGeometry';
import { getOrientedPaperSize, orientSize } from './utils/paper';
import { inputLengthToMm, paperPixelSize } from './utils/units';
import { createCalibrationPaper } from './features/calibration/calibration';

const initialPage: PageModel = {
  paper: paperSettingsFromPreferences(RECOMMENDED_PREFERENCES),
  export: { dpi: RECOMMENDED_PREFERENCES.dpi, format: 'png' },
  arrange: { overlap: 'off', layoutSeed: 0 },
  images: [],
};

function makeLayoutItems(images: PlacedImage[], assets: Map<string, ImageAsset>): LayoutItem[] {
  return images.flatMap((image) => {
    const asset = assets.get(image.sourceId);
    if (!asset) return [];
    const aspectRatio = image.rotation % 180 === 0
      ? asset.widthPx / asset.heightPx
      : asset.heightPx / asset.widthPx;
    return [{ image, aspectRatio }];
  });
}

function layoutForChangedPaper(
  current: PageModel,
  nextPaper: PageModel['paper'],
  reframed: PlacedImage[],
  assets: Map<string, ImageAsset>,
): Pick<PageModel, 'arrange' | 'images'> {
  if (isArrangementValid(reframed, nextPaper, current.arrange.overlap, false)) {
    return { arrange: current.arrange, images: reframed };
  }
  const seed = current.arrange.layoutSeed + 1;
  const arranged = createAutoArrangement(makeLayoutItems(reframed, assets), nextPaper, current.arrange.overlap, seed);
  return { arrange: { ...current.arrange, layoutSeed: seed }, images: arranged.images };
}

function preferencesFromPage(page: PageModel): StoredPreferences {
  return {
    paperPresetId: page.paper.presetId,
    customWidthMm: page.paper.widthMm,
    customHeightMm: page.paper.heightMm,
    orientation: page.paper.orientation,
    units: page.paper.units,
    dpi: page.export.dpi,
  };
}

export default function App() {
  const pageHistory = useHistory(initialPage);
  const page = pageHistory.value;
  const [assets, setAssets] = useState<Map<string, ImageAsset>>(new Map());
  const assetsRef = useRef(assets);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [calibrationMode, setCalibrationMode] = useState(false);
  const [route, setRoute] = useState(window.location.hash || '#/');
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    assetsRef.current = assets;
  }, [assets]);

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [route]);

  useEffect(() => {
    const preventFileNavigation = (event: DragEvent) => {
      if (!event.dataTransfer || !dataTransferHasFiles(event.dataTransfer)) return;
      event.preventDefault();
      if (event.type === 'drop') setIsDraggingFiles(false);
    };
    window.addEventListener('dragover', preventFileNavigation, true);
    window.addEventListener('drop', preventFileNavigation, true);
    return () => {
      window.removeEventListener('dragover', preventFileNavigation, true);
      window.removeEventListener('drop', preventFileNavigation, true);
    };
  }, []);

  useEffect(() => () => {
    for (const asset of assetsRef.current.values()) URL.revokeObjectURL(asset.objectUrl);
  }, []);

  useEffect(() => {
    const referenced = referencedSourceIds(pageHistory.values);
    setAssets((current) => {
      let changed = false;
      const next = new Map(current);
      for (const [id, asset] of current) {
        if (!referenced.has(id)) {
          URL.revokeObjectURL(asset.objectUrl);
          next.delete(id);
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [pageHistory.values]);

  useEffect(() => {
    void loadPreferences().then((preferences) => {
      pageHistory.set({
        ...initialPage,
        paper: paperSettingsFromPreferences(preferences),
        export: { dpi: preferences.dpi, format: 'png' },
      }, true);
      setPreferencesLoaded(true);
    });
  }, [pageHistory.set]);

  useEffect(() => {
    if (!preferencesLoaded) return;
    const timeout = window.setTimeout(() => void savePreferences(preferencesFromPage(page)), 250);
    return () => window.clearTimeout(timeout);
  }, [page.paper, page.export.dpi, preferencesLoaded]);

  const calibrationPage = useMemo<PageModel>(() => ({
    paper: createCalibrationPaper(),
    export: { dpi: 300, format: 'png' },
    arrange: { overlap: 'off', layoutSeed: 0 },
    images: [],
  }), []);
  const displayedPage = calibrationMode ? calibrationPage : page;
  const selected = calibrationMode ? null : page.images.find((image) => image.id === selectedId) ?? null;
  const outputPixels = useMemo(
    () => paperPixelSize(displayedPage.paper, displayedPage.export.dpi),
    [displayedPage.export.dpi, displayedPage.paper],
  );

  const updatePlaced = useCallback((id: string, next: PlacedImage) => {
    pageHistory.set((current) => ({
      ...current,
      images: current.images.map((image) => (image.id === id ? next : image)),
    }));
  }, [pageHistory.set]);

  const importFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    setError(null);
    setMessage(`Preparing ${files.length} ${files.length === 1 ? 'photo' : 'photos'} locally…`);
    const results = await Promise.allSettled(files.map(importImageFile));
    const imported = results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
    const failures = results.flatMap((result) => (result.status === 'rejected' ? [result.reason] : []));

    if (imported.length > 0) {
      const nextAssets = new Map(assetsRef.current);
      for (const item of imported) nextAssets.set(item.asset.id, item.asset);
      assetsRef.current = nextAssets;
      setAssets(nextAssets);
      pageHistory.set((current) => {
        const seed = current.arrange.layoutSeed + 1;
        const arranged = placeImportedImages(
          makeLayoutItems(current.images, nextAssets),
          makeLayoutItems(imported.map((item) => item.placed), nextAssets),
          current.paper,
          current.arrange.overlap,
          seed,
        );
        return { ...current, arrange: { ...current.arrange, layoutSeed: seed }, images: arranged.images };
      });
      setSelectedId(imported.at(-1)?.placed.id ?? null);
      setMessage(`${imported.length} ${imported.length === 1 ? 'photo' : 'photos'} added. Nothing left your device.`);
    } else {
      setMessage(null);
    }
    if (failures.length > 0) {
      const first = failures[0] instanceof Error ? failures[0].message : 'One or more files could not be imported.';
      setError(failures.length === 1 ? first : `${failures.length} files could not be imported. ${first}`);
    }
  }, [pageHistory.set]);

  const handleDroppedFiles = useCallback((files: File[]) => {
    setIsDraggingFiles(false);
    void importFiles(files);
  }, [importFiles]);

  const autoArrange = useCallback(() => {
    pageHistory.set((current) => {
      if (current.images.length === 0) return current;
      const seed = current.arrange.layoutSeed + 1;
      const arranged = createAutoArrangement(
        makeLayoutItems(current.images, assetsRef.current),
        current.paper,
        current.arrange.overlap,
        seed,
        arrangementSignature(current.images),
      );
      return { ...current, arrange: { ...current.arrange, layoutSeed: seed }, images: arranged.images };
    });
    setMessage('A fresh automatic arrangement was applied. Undo restores the previous layout.');
  }, [pageHistory.set]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    pageHistory.set((current) => ({ ...current, images: current.images.filter((image) => image.id !== selectedId) }));
    setSelectedId(null);
  }, [pageHistory.set, selectedId]);

  const duplicateSelected = useCallback(() => {
    if (!selected) return;
    const asset = assetsRef.current.get(selected.sourceId);
    if (!asset) return;
    const duplicate: PlacedImage = {
      ...selected,
      id: crypto.randomUUID(),
      fit: 'fit',
      frame: clampNormalizedRect({ ...selected.frame }),
    };
    pageHistory.set((current) => {
      const seed = current.arrange.layoutSeed + 1;
      const arranged = placeImportedImages(
        makeLayoutItems(current.images, assetsRef.current),
        makeLayoutItems([duplicate], assetsRef.current),
        current.paper,
        current.arrange.overlap,
        seed,
      );
      return { ...current, arrange: { ...current.arrange, layoutSeed: seed }, images: arranged.images };
    });
    setSelectedId(duplicate.id);
  }, [pageHistory.set, selected]);

  const rotateSelected = useCallback(() => {
    if (!selected) return;
    const rotated = rotatePlacedImage90(selected, page.paper);
    if (!isPlacementAllowed(rotated, page.images.filter((other) => other.id !== selected.id), page.paper, page.arrange.overlap)) {
      setMessage('Rotation would create a disallowed overlap. Move or resize the photo first.');
      return;
    }
    pageHistory.set((current) => ({ ...current, images: current.images.map((image) => image.id === selected.id ? rotated : image) }));
    setMessage('Selected photo rotated 90°.');
  }, [page.arrange.overlap, page.images, page.paper, pageHistory.set, selected]);

  const setOverlap = (overlap: OverlapMode) => {
    pageHistory.set((current) => {
      const seed = current.arrange.layoutSeed + 1;
      if (overlap === 'off' && !isArrangementValid(current.images, current.paper, 'off', false)) {
        const arranged = createAutoArrangement(makeLayoutItems(current.images, assetsRef.current), current.paper, 'off', seed);
        return { ...current, arrange: { overlap, layoutSeed: seed }, images: arranged.images };
      }
      return { ...current, arrange: { ...current.arrange, overlap } };
    });
    setMessage(overlap === 'off' ? 'Overlap Off: photo rectangles will stay separate.' : 'Corners: only small corner overlaps up to 5 mm are allowed.');
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.matches('input, select, textarea')) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) pageHistory.redo();
        else pageHistory.undo();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        pageHistory.redo();
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        deleteSelected();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [deleteSelected, pageHistory.redo, pageHistory.undo]);

  const setPaperPreset = (presetId: PaperPresetId) => {
    pageHistory.set((current) => {
      const size = getOrientedPaperSize(
        presetId,
        current.paper.orientation,
        presetId === 'custom' ? { widthMm: current.paper.widthMm, heightMm: current.paper.heightMm } : undefined,
      );
      const nextPaper = { ...current.paper, presetId, ...size };
      const reframed = reframeImagesForPaper(current.images, current.paper, size);
      return { ...current, paper: nextPaper, ...layoutForChangedPaper(current, nextPaper, reframed, assetsRef.current) };
    });
  };

  const setOrientation = (orientation: Orientation) => {
    pageHistory.set((current) => {
      const size = current.paper.presetId === 'custom'
        ? orientSize(current.paper, orientation)
        : getOrientedPaperSize(current.paper.presetId, orientation);
      const nextPaper = { ...current.paper, orientation, ...size };
      const reframed = reframeImagesForPaper(current.images, current.paper, size);
      return { ...current, paper: nextPaper, ...layoutForChangedPaper(current, nextPaper, reframed, assetsRef.current) };
    });
  };

  const setUnits = (units: DisplayUnit) => {
    pageHistory.set((current) => ({ ...current, paper: { ...current.paper, units } }));
  };

  const setCustomSize = (axis: 'width' | 'height', value: number) => {
    if (!Number.isFinite(value) || value <= 0) return;
    pageHistory.set((current) => {
      const nextPaper = {
        ...current.paper,
        [axis === 'width' ? 'widthMm' : 'heightMm']: inputLengthToMm(value, current.paper.units),
      };
      const reframed = reframeImagesForPaper(current.images, current.paper, nextPaper);
      return { ...current, paper: nextPaper, ...layoutForChangedPaper(current, nextPaper, reframed, assetsRef.current) };
    });
  };

  const setDpi = (dpi: number) => {
    pageHistory.set((current) => ({ ...current, export: { ...current.export, dpi } }));
  };

  const setSelectedFit = (fit: ImageFit) => {
    if (selected) updatePlaced(selected.id, { ...selected, fit });
  };

  const exportPng = async () => {
    setError(null);
    setExporting(true);
    setMessage(`Rendering ${outputPixels.width.toLocaleString()} × ${outputPixels.height.toLocaleString()} pixels locally…`);
    try {
      const result = await renderPageToPng(displayedPage, assets, { calibration: calibrationMode });
      downloadExport(result, calibrationMode ? 'kairix-print-calibration' : 'kairix-layout');
      setMessage(`${calibrationMode ? 'Calibration PNG' : 'PNG'} ready: ${result.width.toLocaleString()} × ${result.height.toLocaleString()} pixels at ${displayedPage.export.dpi} DPI.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The PNG could not be exported.');
      setMessage(null);
    } finally {
      setExporting(false);
    }
  };

  const printComposition = async () => {
    setError(null);
    setPrinting(true);
    setMessage('Preparing the full-resolution page locally for printing…');
    try {
      await printPage(displayedPage, assets, { calibration: calibrationMode });
      setMessage('Print dialog opened. Use Actual Size or 100% and disable Fit to page when available.');
    } catch (caught) {
      const detail = caught instanceof Error ? caught.message : 'The print document could not be prepared.';
      setError(`${detail} Use Export PNG as a fallback.`);
      setMessage(null);
    } finally {
      setPrinting(false);
    }
  };

  const restoreDefaults = async () => {
    const preferences = await restoreRecommendedPreferences();
    pageHistory.set((current) => ({
      ...current,
      paper: paperSettingsFromPreferences(preferences),
      export: { dpi: preferences.dpi, format: 'png' },
      arrange: { ...current.arrange, overlap: 'off' },
    }));
    setMessage('Recommended A4, portrait, millimetre and 300 DPI settings restored.');
  };

  const toggleCalibration = () => {
    setCalibrationMode((current) => !current);
    setSelectedId(null);
    setError(null);
    setMessage(calibrationMode ? 'Photo layout restored.' : 'A4 calibration sheet ready. Print the export at Actual Size or 100%.');
  };

  if (route === '#/help') return <HelpPage />;

  return (
    <div
      className={`app-shell ${isDraggingFiles ? 'is-file-dragging' : ''}`}
      onDragEnter={(event) => {
        if (!calibrationMode && dataTransferHasSupportedImage(event.dataTransfer)) setIsDraggingFiles(true);
      }}
      onDragOver={(event) => {
        if (calibrationMode || !dataTransferHasFiles(event.dataTransfer)) return;
        event.preventDefault();
        if (!isInteractiveDropTarget(event.target)) event.dataTransfer.dropEffect = 'copy';
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDraggingFiles(false);
      }}
      onDrop={(event) => {
        if (!dataTransferHasFiles(event.dataTransfer)) return;
        event.preventDefault();
        setIsDraggingFiles(false);
        if (!calibrationMode && !isInteractiveDropTarget(event.target)) handleDroppedFiles(Array.from(event.dataTransfer.files));
      }}
    >
      {isDraggingFiles && !calibrationMode && <div className="drop-overlay" role="status"><Icon name="upload" /><strong>Drop photos to add them</strong><span>JPEG, PNG and WebP stay on this device</span></div>}
      <header className="app-header">
        <a className="brand" href="#/" aria-label="Kairix Quick Layout and Print home">
          <BrandMark />
          <span><strong>Kairix</strong> Quick Layout & Print</span>
        </a>
        <div className="privacy-pill"><Icon name="shield" /><span><strong>Your photos stay on this device.</strong><span className="privacy-detail"> Processed locally, never uploaded.</span></span></div>
      </header>

      <input
        ref={fileInputRef}
        className="visually-hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        multiple
        onChange={(event) => {
          void importFiles(Array.from(event.target.files ?? []));
          event.target.value = '';
        }}
      />

      <EditorToolbar
        hasSelection={Boolean(selected)}
        hasPhotos={page.images.length > 0}
        canUndo={pageHistory.canUndo}
        canRedo={pageHistory.canRedo}
        onPick={() => fileInputRef.current?.click()}
        onAutoArrange={autoArrange}
        onUndo={pageHistory.undo}
        onRedo={pageHistory.redo}
        onDuplicate={duplicateSelected}
        onDelete={deleteSelected}
        onRotateSelected={rotateSelected}
        calibrationMode={calibrationMode}
        onToggleCalibration={toggleCalibration}
      />

      {(message || error) && (
        <div className={`status-banner ${error ? 'status-banner--error' : ''}`} role={error ? 'alert' : 'status'}>
          {error ?? message}
          <button type="button" onClick={() => { setMessage(null); setError(null); }} aria-label="Dismiss message">×</button>
        </div>
      )}

      <main className="editor-layout">
        {calibrationMode ? <section className="calibration-panel panel-card" aria-labelledby="calibration-heading">
          <p className="eyebrow">Utility</p>
          <h2 id="calibration-heading">Print calibration</h2>
          <p>Export this A4 sheet, then print at <strong>Actual Size</strong> or <strong>100%</strong>.</p>
          <ul>
            <li>Measure the 100 × 100 mm square.</li>
            <li>Check both labelled 100 mm rulers.</li>
            <li>Confirm the 5 mm margin indicators.</li>
          </ul>
        </section> : <PhotoTray
          images={page.images}
          assets={assets}
          paper={page.paper}
          targetDpi={page.export.dpi}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onFitChange={setSelectedFit}
          overlap={page.arrange.overlap}
          onOverlapChange={setOverlap}
          onDropFiles={handleDroppedFiles}
        />}
        <div className="mobile-utility-row">
          <button type="button" className="mobile-calibration-button" aria-label={calibrationMode ? 'Back to photo layout' : 'Print calibration'} onClick={toggleCalibration}>{calibrationMode ? 'Back to photo layout' : 'Open print calibration utility'}</button>
          <a className="mobile-calibration-button" href="#/help">Help</a>
        </div>
        <CanvasEditor
          paper={displayedPage.paper}
          images={displayedPage.images}
          assets={assets}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onChange={updatePlaced}
          onDropFiles={handleDroppedFiles}
          overlap={page.arrange.overlap}
          fileDragActive={isDraggingFiles}
          onConstraintViolation={() => setMessage(page.arrange.overlap === 'off' ? 'Overlap is Off. Move or resize the photo into open space.' : 'Only small corner overlaps up to 5 mm are allowed.')}
          calibration={calibrationMode}
        />
        <SettingsPanel
          paper={displayedPage.paper}
          dpi={displayedPage.export.dpi}
          outputPixels={outputPixels}
          exporting={exporting}
          printing={printing}
          onPresetChange={setPaperPreset}
          onOrientationChange={setOrientation}
          onUnitsChange={setUnits}
          onCustomSizeChange={setCustomSize}
          onDpiChange={setDpi}
          onExport={() => void exportPng()}
          onPrint={() => void printComposition()}
          onRestoreDefaults={() => void restoreDefaults()}
          calibrationMode={calibrationMode}
        />
      </main>

      <footer className="app-footer">
        <span>A private, offline-ready print workspace · No accounts · No analytics · No cloud processing</span>
        <CoffeeSupportLink />
      </footer>
    </div>
  );
}
