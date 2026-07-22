import { useEffect, useMemo, useRef, useState } from 'react';
import { Group, Image as KonvaImage, Layer, Rect, Stage, Transformer } from 'react-konva';
import Konva from 'konva';
import type { ImageAsset, OverlapMode, PaperSettings, PlacedImage } from '../../models/types';
import { calculateImageDraw, clampNormalizedRect } from '../../utils/imageGeometry';
import { isPlacementAllowed } from '../layout/autoArrange';
import { drawCalibrationSheet } from '../calibration/calibration';

interface Props {
  paper: PaperSettings;
  images: PlacedImage[];
  assets: Map<string, ImageAsset>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (id: string, image: PlacedImage) => void;
  onDropFiles: (files: File[]) => void;
  overlap: OverlapMode;
  fileDragActive?: boolean;
  onConstraintViolation?: () => void;
  calibration?: boolean;
}

function CalibrationPreview({ width, height, paper }: { width: number; height: number; paper: PaperSettings }) {
  const canvas = useMemo(() => {
    const preview = document.createElement('canvas');
    preview.width = Math.max(1, Math.round(width));
    preview.height = Math.max(1, Math.round(height));
    const context = preview.getContext('2d');
    if (context) drawCalibrationSheet(context, preview.width, preview.height, paper);
    return preview;
  }, [height, paper, width]);
  return <KonvaImage image={canvas} width={width} height={height} listening={false} />;
}

interface PreviewSize {
  width: number;
  height: number;
}

function usePreviewSize(containerRef: React.RefObject<HTMLDivElement | null>, paper: PaperSettings): PreviewSize {
  const [container, setContainer] = useState({ width: 720, height: 720 });
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setContainer({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [containerRef]);

  return useMemo(() => {
    const availableWidth = Math.max(220, container.width - 56);
    const availableHeight = Math.max(280, Math.min(820, container.height - 56));
    const ratio = paper.widthMm / paper.heightMm;
    let width = availableWidth;
    let height = width / ratio;
    if (height > availableHeight) {
      height = availableHeight;
      width = height * ratio;
    }
    return { width, height };
  }, [container, paper.heightMm, paper.widthMm]);
}

function PlacedPhoto({
  placed,
  asset,
  pageWidth,
  pageHeight,
  selected,
  onSelect,
  onChange,
  nodeRef,
}: {
  placed: PlacedImage;
  asset: ImageAsset;
  pageWidth: number;
  pageHeight: number;
  selected: boolean;
  onSelect: () => void;
  onChange: (image: PlacedImage) => boolean;
  nodeRef: (node: Konva.Group | null) => void;
}) {
  const x = placed.frame.x * pageWidth;
  const y = placed.frame.y * pageHeight;
  const width = placed.frame.width * pageWidth;
  const height = placed.frame.height * pageHeight;
  const rotated = placed.rotation % 180 !== 0;
  const localWidth = rotated ? height : width;
  const localHeight = rotated ? width : height;
  const sourceWidth = rotated ? asset.heightPx : asset.widthPx;
  const sourceHeight = rotated ? asset.widthPx : asset.heightPx;
  const draw = calculateImageDraw(sourceWidth, sourceHeight, localWidth, localHeight, placed.fit);
  const baseScale = Math.min(localWidth / asset.widthPx, localHeight / asset.heightPx);
  const fillScale = Math.max(localWidth / asset.widthPx, localHeight / asset.heightPx);
  const imageScale = placed.fit === 'fit' ? baseScale : fillScale;
  const imageWidth = asset.widthPx * imageScale;
  const imageHeight = asset.heightPx * imageScale;

  return (
    <Group
      ref={nodeRef}
      x={x}
      y={y}
      width={width}
      height={height}
      clipX={0}
      clipY={0}
      clipWidth={width}
      clipHeight={height}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragStart={onSelect}
      onDragEnd={(event) => {
        const node = event.target;
        const accepted = onChange({
          ...placed,
          frame: clampNormalizedRect({
            ...placed.frame,
            x: node.x() / pageWidth,
            y: node.y() / pageHeight,
          }),
        });
        if (!accepted) {
          node.position({ x, y });
          node.getLayer()?.batchDraw();
        }
      }}
      onTransformEnd={(event) => {
        const node = event.target;
        const next = clampNormalizedRect({
          x: node.x() / pageWidth,
          y: node.y() / pageHeight,
          width: (width * node.scaleX()) / pageWidth,
          height: (height * node.scaleY()) / pageHeight,
        });
        node.scaleX(1);
        node.scaleY(1);
        if (!onChange({ ...placed, frame: next })) {
          node.position({ x, y });
          node.getLayer()?.batchDraw();
        }
      }}
    >
      <Rect width={width} height={height} fill="#f2f0ea" stroke={selected ? '#b18300' : '#d7d3ca'} strokeWidth={selected ? 2 : 1} />
      <Group x={width / 2} y={height / 2} rotation={placed.rotation}>
        <KonvaImage
          image={asset.image}
          x={-imageWidth / 2}
          y={-imageHeight / 2}
          width={imageWidth}
          height={imageHeight}
          opacity={1}
        />
        {placed.fit === 'fit' && (
          <Rect
            x={-localWidth / 2 + draw.dx}
            y={-localHeight / 2 + draw.dy}
            width={draw.dw}
            height={draw.dh}
            stroke="rgba(255,255,255,.22)"
            listening={false}
          />
        )}
      </Group>
    </Group>
  );
}

export function CanvasEditor({ paper, images, assets, selectedId, onSelect, onChange, onDropFiles, overlap, fileDragActive = false, onConstraintViolation, calibration = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const nodesRef = useRef(new Map<string, Konva.Group>());
  const size = usePreviewSize(containerRef, paper);
  const marginX = (paper.safeMarginMm / paper.widthMm) * size.width;
  const marginY = (paper.safeMarginMm / paper.heightMm) * size.height;

  useEffect(() => {
    const transformer = transformerRef.current;
    const selectedNode = selectedId ? nodesRef.current.get(selectedId) : undefined;
    if (transformer) {
      transformer.nodes(selectedNode ? [selectedNode] : []);
      transformer.getLayer()?.batchDraw();
    }
  }, [selectedId, images]);

  return (
    <div
      ref={containerRef}
      className={`canvas-workspace ${fileDragActive ? 'drop-target-active' : ''}`}
      data-testid="canvas-workspace"
      data-drop-target="canvas"
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDropFiles(Array.from(event.dataTransfer.files));
      }}
    >
      <div className="page-size-label">
        {paper.widthMm} × {paper.heightMm} mm · {paper.orientation === 'portrait' ? 'Portrait' : 'Landscape'} · 5 mm safe margin
      </div>
      <div className="page-shadow" style={{ width: size.width, height: size.height }}>
        <Stage
          width={size.width}
          height={size.height}
          onMouseDown={(event) => {
            if (event.target === event.target.getStage()) onSelect(null);
          }}
          onTouchStart={(event) => {
            if (event.target === event.target.getStage()) onSelect(null);
          }}
        >
          <Layer>
            <Rect width={size.width} height={size.height} fill="white" />
            {calibration ? <CalibrationPreview width={size.width} height={size.height} paper={paper} /> : <Rect
              x={marginX}
              y={marginY}
              width={size.width - marginX * 2}
              height={size.height - marginY * 2}
              stroke="#d5a900"
              strokeWidth={1.25}
              dash={[6, 5]}
              listening={false}
            />}
            {!calibration && images.map((placed) => {
              const asset = assets.get(placed.sourceId);
              return asset ? (
                <PlacedPhoto
                  key={placed.id}
                  placed={placed}
                  asset={asset}
                  pageWidth={size.width}
                  pageHeight={size.height}
                  selected={placed.id === selectedId}
                  onSelect={() => onSelect(placed.id)}
                  onChange={(next) => {
                    if (!isPlacementAllowed(next, images.filter((other) => other.id !== placed.id), paper, overlap)) {
                      onConstraintViolation?.();
                      return false;
                    }
                    onChange(placed.id, next);
                    return true;
                  }}
                  nodeRef={(node) => {
                    if (node) nodesRef.current.set(placed.id, node);
                    else nodesRef.current.delete(placed.id);
                  }}
                />
              ) : null;
            })}
            {!calibration && <Transformer
              ref={transformerRef}
              rotateEnabled={false}
              flipEnabled={false}
              borderStroke="#b18300"
              anchorFill="#f5c842"
              anchorStroke="#6e5500"
              anchorSize={10}
              keepRatio={false}
              boundBoxFunc={(oldBox, newBox) => (newBox.width < 24 || newBox.height < 24 ? oldBox : newBox)}
            />}
          </Layer>
        </Stage>
      </div>
      <p className="drop-hint">{calibration ? 'Calibration sheet · exported with exact physical dimensions' : 'Drop JPEG, PNG or WebP files anywhere here'}</p>
    </div>
  );
}
