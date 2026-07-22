const SUPPORTED_DROP_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function dataTransferHasFiles(dataTransfer: DataTransfer): boolean {
  return Array.from(dataTransfer.types).includes('Files')
    || Array.from(dataTransfer.items).some((item) => item.kind === 'file');
}

export function dataTransferHasSupportedImage(dataTransfer: DataTransfer): boolean {
  return Array.from(dataTransfer.items).some((item) => (
    item.kind === 'file' && (item.type === '' || SUPPORTED_DROP_TYPES.has(item.type))
  ));
}

export function isInteractiveDropTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('button, a, input, select, textarea, label, [role="button"]'));
}
