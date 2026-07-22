import type { ImageAsset, PlacedImage } from '../../models/types';

const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The browser could not decode this image.'));
    image.src = url;
  });
}

export async function importImageFile(file: File): Promise<{ asset: ImageAsset; placed: PlacedImage }> {
  if (!SUPPORTED_TYPES.has(file.type)) {
    throw new Error(`${file.name}: only JPEG, PNG and WebP images are supported.`);
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadHtmlImage(objectUrl);
    const id = crypto.randomUUID();
    const asset: ImageAsset = {
      id,
      name: file.name,
      file,
      objectUrl,
      image,
      widthPx: image.naturalWidth,
      heightPx: image.naturalHeight,
    };
    const aspect = image.naturalWidth / image.naturalHeight;
    const width = Math.min(0.42, Math.max(0.18, 0.3 * Math.sqrt(aspect)));
    const height = Math.min(0.42, Math.max(0.16, width / aspect));
    const placed: PlacedImage = {
      id: crypto.randomUUID(),
      sourceId: id,
      frame: { x: 0.08, y: 0.08, width, height },
      rotation: 0,
      fit: 'fit',
      crop: null,
      locked: false,
      autoLayoutEligible: true,
    };
    return { asset, placed };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}
