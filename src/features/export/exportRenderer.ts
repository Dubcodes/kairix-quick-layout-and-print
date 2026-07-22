import type { ImageAsset, PageModel, PlacedImage } from '../../models/types';
import { paperPixelSize } from '../../utils/units';
import { calculateImageDraw } from '../../utils/imageGeometry';
import { addPngPhysicalResolution } from './pngMetadata';
import { drawCalibrationSheet } from '../calibration/calibration';

export interface ExportResult {
  blob: Blob;
  width: number;
  height: number;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed.'))), 'image/png');
  });
}

function drawPlacedImage(
  context: CanvasRenderingContext2D,
  placed: PlacedImage,
  asset: ImageAsset,
  pageWidth: number,
  pageHeight: number,
): void {
  const x = placed.frame.x * pageWidth;
  const y = placed.frame.y * pageHeight;
  const frameWidth = placed.frame.width * pageWidth;
  const frameHeight = placed.frame.height * pageHeight;
  const quarterTurns = placed.rotation / 90;
  const rotated = quarterTurns % 2 !== 0;
  const localWidth = rotated ? frameHeight : frameWidth;
  const localHeight = rotated ? frameWidth : frameHeight;
  const draw = calculateImageDraw(asset.widthPx, asset.heightPx, localWidth, localHeight, placed.fit);

  context.save();
  context.translate(x + frameWidth / 2, y + frameHeight / 2);
  context.rotate((placed.rotation * Math.PI) / 180);
  context.beginPath();
  context.rect(-localWidth / 2, -localHeight / 2, localWidth, localHeight);
  context.clip();
  context.drawImage(
    asset.image,
    draw.sx,
    draw.sy,
    draw.sw,
    draw.sh,
    -localWidth / 2 + draw.dx,
    -localHeight / 2 + draw.dy,
    draw.dw,
    draw.dh,
  );
  context.restore();
}

export async function renderPageToPng(
  page: PageModel,
  assets: Map<string, ImageAsset>,
  options: { calibration?: boolean } = {},
): Promise<ExportResult> {
  const { width, height } = paperPixelSize(page.paper, page.export.dpi);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Your browser could not create an export canvas.');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.fillStyle = page.paper.background;
  context.fillRect(0, 0, width, height);

  if (options.calibration) {
    drawCalibrationSheet(context, width, height, page.paper);
  } else {
    for (const placed of page.images) {
      const asset = assets.get(placed.sourceId);
      if (asset) drawPlacedImage(context, placed, asset, width, height);
    }
  }

  const encoded = await canvasToBlob(canvas);
  const withMetadata = addPngPhysicalResolution(await encoded.arrayBuffer(), page.export.dpi);
  return { blob: new Blob([withMetadata], { type: 'image/png' }), width, height };
}

export function downloadExport(result: ExportResult, basename = 'kairix-layout'): void {
  const url = URL.createObjectURL(result.blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${basename}-${result.width}x${result.height}.png`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
