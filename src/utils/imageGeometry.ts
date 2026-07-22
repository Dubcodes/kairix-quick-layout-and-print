import type { ImageAsset, NormalizedRect, PaperSettings, PhysicalSize, PlacedImage } from '../models/types';

export interface DrawRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

export function calculateImageDraw(
  sourceWidth: number,
  sourceHeight: number,
  frameWidth: number,
  frameHeight: number,
  mode: 'fit' | 'fill',
): DrawRect {
  if (mode === 'fit') {
    const scale = Math.min(frameWidth / sourceWidth, frameHeight / sourceHeight);
    const dw = sourceWidth * scale;
    const dh = sourceHeight * scale;
    return {
      sx: 0,
      sy: 0,
      sw: sourceWidth,
      sh: sourceHeight,
      dx: (frameWidth - dw) / 2,
      dy: (frameHeight - dh) / 2,
      dw,
      dh,
    };
  }

  const sourceRatio = sourceWidth / sourceHeight;
  const frameRatio = frameWidth / frameHeight;
  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;
  if (sourceRatio > frameRatio) {
    sw = sourceHeight * frameRatio;
    sx = (sourceWidth - sw) / 2;
  } else {
    sh = sourceWidth / frameRatio;
    sy = (sourceHeight - sh) / 2;
  }
  return { sx, sy, sw, sh, dx: 0, dy: 0, dw: frameWidth, dh: frameHeight };
}

export function clampNormalizedRect(rect: NormalizedRect): NormalizedRect {
  const width = Math.max(0.03, Math.min(1, rect.width));
  const height = Math.max(0.03, Math.min(1, rect.height));
  return {
    x: Math.max(0, Math.min(1 - width, rect.x)),
    y: Math.max(0, Math.min(1 - height, rect.y)),
    width,
    height,
  };
}

export function effectivePrintPpi(
  placed: PlacedImage,
  asset: ImageAsset,
  paper: PaperSettings,
): number {
  const frameWidthInches = (placed.frame.width * paper.widthMm) / 25.4;
  const frameHeightInches = (placed.frame.height * paper.heightMm) / 25.4;
  const sourceWidth = placed.rotation % 180 === 0 ? asset.widthPx : asset.heightPx;
  const sourceHeight = placed.rotation % 180 === 0 ? asset.heightPx : asset.widthPx;
  return Math.floor(Math.min(sourceWidth / frameWidthInches, sourceHeight / frameHeightInches));
}

export function reframeImagesForPaper(
  images: PlacedImage[],
  previousPaper: PhysicalSize,
  nextPaper: PhysicalSize,
): PlacedImage[] {
  return images.map((image) => {
    const centreX = image.frame.x + image.frame.width / 2;
    const centreY = image.frame.y + image.frame.height / 2;
    const physicalWidth = image.frame.width * previousPaper.widthMm;
    const physicalHeight = image.frame.height * previousPaper.heightMm;
    const width = Math.min(1, physicalWidth / nextPaper.widthMm);
    const height = Math.min(1, physicalHeight / nextPaper.heightMm);
    return {
      ...image,
      frame: clampNormalizedRect({
        x: centreX - width / 2,
        y: centreY - height / 2,
        width,
        height,
      }),
    };
  });
}

export function rotatePlacedImage90(image: PlacedImage, paper: PhysicalSize): PlacedImage {
  const centreX = image.frame.x + image.frame.width / 2;
  const centreY = image.frame.y + image.frame.height / 2;
  const physicalWidth = image.frame.width * paper.widthMm;
  const physicalHeight = image.frame.height * paper.heightMm;
  const width = physicalHeight / paper.widthMm;
  const height = physicalWidth / paper.heightMm;
  return {
    ...image,
    rotation: ((image.rotation + 90) % 360) as PlacedImage['rotation'],
    frame: clampNormalizedRect({ x: centreX - width / 2, y: centreY - height / 2, width, height }),
  };
}
