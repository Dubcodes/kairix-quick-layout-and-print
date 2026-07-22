import type { ImageAsset, PageModel } from '../../models/types';
import { APP_NAME } from '../../models/appMetadata';
import { renderPageToPng } from '../export/exportRenderer';

export interface PrintPlacement {
  id: string;
  sourceId: string;
  frame: { x: number; y: number; width: number; height: number };
  rotation: 0 | 90 | 180 | 270;
  fit: 'fit' | 'fill';
  crop: null;
  layer: number;
}

export interface PrintPlan {
  widthMm: number;
  heightMm: number;
  orientation: 'portrait' | 'landscape';
  dpi: number;
  background: '#ffffff';
  placements: PrintPlacement[];
}

function mm(value: number): string {
  return Number(value.toFixed(4)).toString();
}

export function createPrintPlan(page: PageModel): PrintPlan {
  return {
    widthMm: page.paper.widthMm,
    heightMm: page.paper.heightMm,
    orientation: page.paper.orientation,
    dpi: page.export.dpi,
    background: page.paper.background,
    placements: page.images.map((image, layer) => ({
      id: image.id,
      sourceId: image.sourceId,
      frame: { ...image.frame },
      rotation: image.rotation,
      fit: image.fit,
      crop: image.crop,
      layer,
    })),
  };
}

export function buildPrintDocumentMarkup(plan: PrintPlan): string {
  const width = mm(plan.widthMm);
  const height = mm(plan.heightMm);
  return `<!doctype html>
<html lang="en" data-paper-width-mm="${width}" data-paper-height-mm="${height}" data-orientation="${plan.orientation}">
<head>
  <meta charset="utf-8">
  <title>${APP_NAME} print</title>
  <style>
    @page { size: ${width}mm ${height}mm; margin: 0; }
    * { box-sizing: border-box; }
    html, body { width: ${width}mm; height: ${height}mm; margin: 0; padding: 0; overflow: hidden; background: #fff; }
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    #kairix-print-image { display: block; width: ${width}mm; height: ${height}mm; margin: 0; object-fit: fill; }
  </style>
</head>
<body><img id="kairix-print-image" alt=""></body>
</html>`;
}

function waitForImage(image: HTMLImageElement): Promise<void> {
  if (image.complete && image.naturalWidth > 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('The browser could not prepare the print image.'));
  });
}

export async function printPage(
  page: PageModel,
  assets: Map<string, ImageAsset>,
  options: { calibration?: boolean } = {},
): Promise<PrintPlan> {
  if (typeof window.print !== 'function') throw new Error('This browser does not provide a usable print dialog.');
  const plan = createPrintPlan(page);
  let frame: HTMLIFrameElement | null = null;
  let imageUrl: string | null = null;
  let cleanupTimer: number | null = null;
  const cleanup = () => {
    if (cleanupTimer !== null) window.clearTimeout(cleanupTimer);
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    frame?.remove();
    frame = null;
    imageUrl = null;
  };

  try {
    const rendered = await renderPageToPng(page, assets, options);
    frame = document.createElement('iframe');
    frame.className = 'print-document-frame';
    frame.setAttribute('data-testid', 'print-document');
    frame.setAttribute('aria-hidden', 'true');
    frame.title = `${APP_NAME} print document`;
    document.body.append(frame);
    const printDocument = frame.contentDocument;
    const printWindow = frame.contentWindow;
    if (!printDocument || !printWindow || typeof printWindow.print !== 'function') {
      throw new Error('The browser blocked the isolated print document.');
    }
    printDocument.open();
    printDocument.write(buildPrintDocumentMarkup(plan));
    printDocument.close();
    const image = printDocument.getElementById('kairix-print-image');
    if (!image || image.tagName !== 'IMG') throw new Error('The browser could not create the print page.');
    const printImage = image as HTMLImageElement;
    printImage.dataset.pixelWidth = String(rendered.width);
    printImage.dataset.pixelHeight = String(rendered.height);
    imageUrl = URL.createObjectURL(rendered.blob);
    printImage.src = imageUrl;
    await waitForImage(printImage);
    printWindow.addEventListener('afterprint', cleanup, { once: true });
    cleanupTimer = window.setTimeout(cleanup, 120_000);
    printWindow.focus();
    printWindow.print();
    return plan;
  } catch (error) {
    cleanup();
    throw error;
  }
}
