import type { NormalizedRect, OverlapMode, PaperSettings, PlacedImage } from '../../models/types';

export const DEFAULT_GUTTER_MM = 3;
export const MAX_CORNER_OVERLAP_MM = 5;

const EPSILON = 0.0001;

export interface LayoutItem {
  image: PlacedImage;
  aspectRatio: number;
}

export interface PhysicalRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ArrangementResult {
  images: PlacedImage[];
  score: number;
  signature: string;
}

function safeRect(paper: PaperSettings): PhysicalRect {
  return {
    x: paper.safeMarginMm,
    y: paper.safeMarginMm,
    width: Math.max(1, paper.widthMm - paper.safeMarginMm * 2),
    height: Math.max(1, paper.heightMm - paper.safeMarginMm * 2),
  };
}

export function normalizedToPhysical(frame: NormalizedRect, paper: PaperSettings): PhysicalRect {
  return {
    x: frame.x * paper.widthMm,
    y: frame.y * paper.heightMm,
    width: frame.width * paper.widthMm,
    height: frame.height * paper.heightMm,
  };
}

function physicalToNormalized(rect: PhysicalRect, paper: PaperSettings): NormalizedRect {
  return {
    x: rect.x / paper.widthMm,
    y: rect.y / paper.heightMm,
    width: rect.width / paper.widthMm,
    height: rect.height / paper.heightMm,
  };
}

function intersection(a: PhysicalRect, b: PhysicalRect): PhysicalRect | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  if (right - x <= EPSILON || bottom - y <= EPSILON) return null;
  return { x, y, width: right - x, height: bottom - y };
}

function inset(rect: PhysicalRect, fraction: number): PhysicalRect {
  const x = rect.width * fraction;
  const y = rect.height * fraction;
  return { x: rect.x + x, y: rect.y + y, width: rect.width - x * 2, height: rect.height - y * 2 };
}

function isInside(rect: PhysicalRect, boundary: PhysicalRect): boolean {
  return rect.x >= boundary.x - EPSILON
    && rect.y >= boundary.y - EPSILON
    && rect.x + rect.width <= boundary.x + boundary.width + EPSILON
    && rect.y + rect.height <= boundary.y + boundary.height + EPSILON;
}

export function isPairPlacementAllowed(a: PhysicalRect, b: PhysicalRect, mode: OverlapMode): boolean {
  const overlap = intersection(a, b);
  if (!overlap) return true;
  if (mode === 'off') return false;
  if (overlap.width > MAX_CORNER_OVERLAP_MM + EPSILON || overlap.height > MAX_CORNER_OVERLAP_MM + EPSILON) return false;
  return !intersection(overlap, inset(a, 0.25)) && !intersection(overlap, inset(b, 0.25));
}

export function isPlacementAllowed(
  image: PlacedImage,
  others: PlacedImage[],
  paper: PaperSettings,
  mode: OverlapMode,
  insideSafeMargin = false,
): boolean {
  const rect = normalizedToPhysical(image.frame, paper);
  const boundary = insideSafeMargin ? safeRect(paper) : { x: 0, y: 0, width: paper.widthMm, height: paper.heightMm };
  return isInside(rect, boundary)
    && others.every((other) => isPairPlacementAllowed(rect, normalizedToPhysical(other.frame, paper), mode));
}

export function isArrangementValid(
  images: PlacedImage[],
  paper: PaperSettings,
  mode: OverlapMode,
  insideSafeMargin = true,
): boolean {
  return images.every((image, index) => isPlacementAllowed(image, images.slice(index + 1), paper, mode, insideSafeMargin));
}

export function arrangementSignature(images: PlacedImage[]): string {
  return images
    .map((image) => `${image.id}:${image.frame.x.toFixed(5)},${image.frame.y.toFixed(5)},${image.frame.width.toFixed(5)},${image.frame.height.toFixed(5)}`)
    .sort()
    .join('|');
}

function fitAspect(cell: PhysicalRect, aspectRatio: number, scale = 1, alignment = 0): PhysicalRect {
  let width = cell.width;
  let height = width / aspectRatio;
  if (height > cell.height) {
    height = cell.height;
    width = height * aspectRatio;
  }
  width *= scale;
  height *= scale;
  const spareX = cell.width - width;
  const spareY = cell.height - height;
  const alignX = alignment === 1 ? 0 : alignment === 2 ? 1 : 0.5;
  const alignY = alignment === 1 ? 0 : alignment === 2 ? 1 : 0.5;
  return { x: cell.x + spareX * alignX, y: cell.y + spareY * alignY, width, height };
}

function seededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(values: T[], seed: number): T[] {
  const random = seededRandom(seed);
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function rowCounts(total: number, rows: number, offset: number): number[] {
  const counts = Array.from({ length: rows }, () => Math.floor(total / rows));
  const remainder = total % rows;
  for (let index = 0; index < remainder; index += 1) counts[(index + offset) % rows] += 1;
  return counts.filter((count) => count > 0);
}

function buildGrid(
  items: LayoutItem[],
  paper: PaperSettings,
  rows: number,
  gutterMm: number,
  scale: number,
  alignment: number,
  distributionOffset: number,
): PlacedImage[] {
  const available = safeRect(paper);
  const counts = rowCounts(items.length, rows, distributionOffset);
  const rowHeight = (available.height - gutterMm * (counts.length - 1)) / counts.length;
  let itemIndex = 0;
  return counts.flatMap((count, row) => {
    const cellWidth = (available.width - gutterMm * (count - 1)) / count;
    return Array.from({ length: count }, (_, column) => {
      const item = items[itemIndex++];
      const cell = {
        x: available.x + column * (cellWidth + gutterMm),
        y: available.y + row * (rowHeight + gutterMm),
        width: cellWidth,
        height: rowHeight,
      };
      const rect = fitAspect(cell, item.aspectRatio, scale, (alignment + row + column) % 3);
      return { ...item.image, fit: 'fit' as const, frame: physicalToNormalized(rect, paper) };
    });
  });
}

function restoreInputOrder(images: PlacedImage[], items: LayoutItem[]): PlacedImage[] {
  const order = new Map(items.map((item, index) => [item.image.id, index]));
  return [...images].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

function edgeDistance(a: PhysicalRect, b: PhysicalRect): number {
  const dx = Math.max(a.x - (b.x + b.width), b.x - (a.x + a.width), 0);
  const dy = Math.max(a.y - (b.y + b.height), b.y - (a.y + a.height), 0);
  return Math.hypot(dx, dy);
}

export function scoreArrangement(
  images: PlacedImage[],
  items: LayoutItem[],
  paper: PaperSettings,
  mode: OverlapMode,
): number {
  if (!isArrangementValid(images, paper, mode, true)) return -1_000_000;
  const available = safeRect(paper);
  const safeArea = available.width * available.height;
  const rects = images.map((image) => normalizedToPhysical(image.frame, paper));
  const usefulArea = rects.reduce((sum, rect) => sum + rect.width * rect.height, 0) / safeArea;
  const left = Math.min(...rects.map((rect) => rect.x));
  const top = Math.min(...rects.map((rect) => rect.y));
  const right = Math.max(...rects.map((rect) => rect.x + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.y + rect.height));
  const coverage = ((right - left) * (bottom - top)) / safeArea;
  const centroidX = rects.reduce((sum, rect) => sum + rect.x + rect.width / 2, 0) / rects.length;
  const centroidY = rects.reduce((sum, rect) => sum + rect.y + rect.height / 2, 0) / rects.length;
  const balanceDistance = Math.hypot(
    (centroidX - (available.x + available.width / 2)) / available.width,
    (centroidY - (available.y + available.height / 2)) / available.height,
  );
  const tinyPenalty = rects.reduce((sum, rect) => {
    const smallEdge = Math.min(rect.width, rect.height);
    const areaShare = (rect.width * rect.height) / safeArea;
    return sum + Math.max(0, (18 - smallEdge) / 18) + Math.max(0, (0.012 - areaShare) * 30);
  }, 0);
  const aspectPenalty = images.reduce((sum, image) => {
    const item = items.find((candidate) => candidate.image.id === image.id);
    const rect = normalizedToPhysical(image.frame, paper);
    return sum + (item ? Math.abs(Math.log((rect.width / rect.height) / item.aspectRatio)) : 0);
  }, 0);
  const nearestGaps = rects.map((rect, index) => Math.min(
    ...rects.filter((_, other) => other !== index).map((other) => edgeDistance(rect, other)),
    DEFAULT_GUTTER_MM,
  ));
  const meanGap = nearestGaps.reduce((sum, value) => sum + value, 0) / nearestGaps.length;
  const gapVariance = nearestGaps.reduce((sum, value) => sum + (value - meanGap) ** 2, 0) / nearestGaps.length;
  const cornerOverlaps = mode === 'corners'
    ? rects.reduce((count, rect, index) => count + rects.slice(index + 1).filter((other) => intersection(rect, other)).length, 0)
    : 0;
  return usefulArea * 110
    + coverage * 22
    + Math.max(0, 1 - balanceDistance) * 10
    - (1 - Math.min(1, usefulArea)) * 18
    - tinyPenalty * 90
    - aspectPenalty * 160
    - gapVariance * 0.4
    + cornerOverlaps * 0.2;
}

function addCornerVariant(images: PlacedImage[], paper: PaperSettings): PlacedImage[] | null {
  const rects = images.map((image) => normalizedToPhysical(image.frame, paper));
  for (let first = 0; first < rects.length; first += 1) {
    for (let second = first + 1; second < rects.length; second += 1) {
      const a = rects[first];
      const b = rects[second];
      const gapX = b.x - (a.x + a.width);
      const gapY = b.y - (a.y + a.height);
      if (gapX >= -EPSILON && gapY >= -EPSILON) {
        const moved = { ...b, x: b.x - gapX - 2, y: b.y - gapY - 2 };
        const next = images.map((image, index) => index === second
          ? { ...image, frame: physicalToNormalized(moved, paper) }
          : image);
        if (isArrangementValid(next, paper, 'corners', true)) return next;
      }
    }
  }
  return null;
}

export function createAutoArrangement(
  items: LayoutItem[],
  paper: PaperSettings,
  mode: OverlapMode,
  seed: number,
  previousSignature?: string,
): ArrangementResult {
  if (items.length === 0) return { images: [], score: 0, signature: '' };
  const candidates = new Map<string, PlacedImage[]>();
  const maxRows = Math.min(items.length, Math.max(4, Math.ceil(Math.sqrt(items.length)) + 2));
  const scales = [1, 0.96, 0.9];
  for (let rows = 1; rows <= maxRows; rows += 1) {
    for (let variant = 0; variant < 8; variant += 1) {
      const ordered = shuffled(items, seed * 97 + rows * 31 + variant * 997);
      for (const scale of scales) {
        const layout = restoreInputOrder(
          buildGrid(ordered, paper, rows, DEFAULT_GUTTER_MM, scale, variant % 3, variant % rows),
          items,
        );
        const signature = arrangementSignature(layout);
        candidates.set(signature, layout);
        if (mode === 'corners') {
          const corner = addCornerVariant(layout, paper);
          if (corner) candidates.set(arrangementSignature(corner), corner);
        }
      }
    }
  }
  const ranked = [...candidates.entries()]
    .filter(([signature]) => signature !== previousSignature)
    .map(([signature, images]) => ({ signature, images, score: scoreArrangement(images, items, paper, mode) }))
    .filter((candidate) => candidate.score > -1_000_000)
    .sort((a, b) => b.score - a.score);
  const top = ranked.slice(0, Math.min(6, ranked.length));
  const selected = top[Math.abs(seed) % top.length] ?? ranked[0];
  if (!selected) throw new Error('No valid automatic layout could be generated for this page.');
  return selected;
}

function inflate(rect: PhysicalRect, amount: number, boundary: PhysicalRect): PhysicalRect {
  const x = Math.max(boundary.x, rect.x - amount);
  const y = Math.max(boundary.y, rect.y - amount);
  const right = Math.min(boundary.x + boundary.width, rect.x + rect.width + amount);
  const bottom = Math.min(boundary.y + boundary.height, rect.y + rect.height + amount);
  return { x, y, width: right - x, height: bottom - y };
}

function subtractRect(free: PhysicalRect, obstacle: PhysicalRect): PhysicalRect[] {
  const overlap = intersection(free, obstacle);
  if (!overlap) return [free];
  const result: PhysicalRect[] = [];
  if (overlap.y > free.y + EPSILON) result.push({ x: free.x, y: free.y, width: free.width, height: overlap.y - free.y });
  if (overlap.y + overlap.height < free.y + free.height - EPSILON) result.push({ x: free.x, y: overlap.y + overlap.height, width: free.width, height: free.y + free.height - overlap.y - overlap.height });
  if (overlap.x > free.x + EPSILON) result.push({ x: free.x, y: overlap.y, width: overlap.x - free.x, height: overlap.height });
  if (overlap.x + overlap.width < free.x + free.width - EPSILON) result.push({ x: overlap.x + overlap.width, y: overlap.y, width: free.x + free.width - overlap.x - overlap.width, height: overlap.height });
  return result.filter((rect) => rect.width >= 4 && rect.height >= 4);
}

function subtractFromFreeRects(freeRects: PhysicalRect[], obstacle: PhysicalRect): PhysicalRect[] {
  const split = freeRects.flatMap((free) => subtractRect(free, obstacle));
  return split
    .filter((rect, index) => !split.some((other, otherIndex) => otherIndex !== index
      && rect.x >= other.x - EPSILON
      && rect.y >= other.y - EPSILON
      && rect.x + rect.width <= other.x + other.width + EPSILON
      && rect.y + rect.height <= other.y + other.height + EPSILON))
    .sort((a, b) => b.width * b.height - a.width * a.height)
    .slice(0, 80);
}

function packNewItems(
  existing: LayoutItem[],
  incoming: LayoutItem[],
  paper: PaperSettings,
): PlacedImage[] | null {
  const boundary = safeRect(paper);
  let freeRects = [boundary];
  for (const item of existing) {
    freeRects = subtractFromFreeRects(
      freeRects,
      inflate(normalizedToPhysical(item.image.frame, paper), DEFAULT_GUTTER_MM, boundary),
    );
  }
  const placed: PlacedImage[] = [];
  for (const item of incoming) {
    const options = freeRects.map((free) => ({ free, fitted: fitAspect(free, item.aspectRatio) }))
      .filter(({ fitted }) => Math.min(fitted.width, fitted.height) >= 12)
      .sort((a, b) => b.fitted.width * b.fitted.height - a.fitted.width * a.fitted.height);
    const best = options[0];
    if (!best) return null;
    const image = { ...item.image, frame: physicalToNormalized(best.fitted, paper) };
    placed.push(image);
    freeRects = subtractFromFreeRects(freeRects, inflate(best.fitted, DEFAULT_GUTTER_MM, boundary));
  }
  return [...existing.map((item) => item.image), ...placed];
}

export function placeImportedImages(
  existing: LayoutItem[],
  incoming: LayoutItem[],
  paper: PaperSettings,
  mode: OverlapMode,
  seed: number,
): ArrangementResult {
  if (existing.length === 0) return createAutoArrangement(incoming, paper, mode, seed);
  const allItems = [...existing, ...incoming];
  const candidates: ArrangementResult[] = [];
  for (let variant = 0; variant < 10; variant += 1) {
    const packed = packNewItems(existing, shuffled(incoming, seed * 101 + variant * 977), paper);
    const ordered = packed ? restoreInputOrder(packed, allItems) : null;
    if (ordered && isArrangementValid(ordered, paper, mode, true)) {
      candidates.push({ images: ordered, score: scoreArrangement(ordered, allItems, paper, mode), signature: arrangementSignature(ordered) });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0] ?? createAutoArrangement(allItems, paper, mode, seed);
}
