import type { CalibrationLayout, PaperSettings } from '../../models/types';
import { paperSettingsFromPreferences, RECOMMENDED_PREFERENCES } from '../../models/defaults';

export function createCalibrationPaper(): PaperSettings {
  return paperSettingsFromPreferences(RECOMMENDED_PREFERENCES);
}

export function createCalibrationLayout(paper = createCalibrationPaper()): CalibrationLayout {
  return {
    paper,
    square: { xMm: 25, yMm: 70, sizeMm: 100 },
    horizontalRuler: { xMm: 25, yMm: 52, lengthMm: 100 },
    verticalRuler: { xMm: 145, yMm: 70, lengthMm: 100 },
  };
}

export function drawCalibrationSheet(
  context: CanvasRenderingContext2D,
  widthPx: number,
  heightPx: number,
  paper = createCalibrationPaper(),
): void {
  const layout = createCalibrationLayout(paper);
  const sx = widthPx / paper.widthMm;
  const sy = heightPx / paper.heightMm;
  const mmX = (value: number) => value * sx;
  const mmY = (value: number) => value * sy;
  const line = Math.max(1, mmX(0.35));

  context.save();
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, widthPx, heightPx);
  context.strokeStyle = '#232522';
  context.fillStyle = '#232522';
  context.lineWidth = line;
  context.lineCap = 'square';
  context.textBaseline = 'alphabetic';

  context.font = `700 ${Math.max(12, mmY(5))}px system-ui, sans-serif`;
  context.fillText('Kairix Print Calibration', mmX(15), mmY(20));
  context.font = `400 ${Math.max(9, mmY(3.2))}px system-ui, sans-serif`;
  context.fillText('Print at Actual Size or 100% — disable “Fit to page”.', mmX(15), mmY(28));
  context.fillText('Measure the square and both rulers after printing. Each should be exactly 100 mm.', mmX(15), mmY(34));

  const margin = paper.safeMarginMm;
  context.save();
  context.strokeStyle = '#d5a900';
  context.lineWidth = Math.max(1, mmX(0.25));
  context.setLineDash([mmX(2), mmX(1.5)]);
  context.strokeRect(mmX(margin), mmY(margin), widthPx - mmX(margin * 2), heightPx - mmY(margin * 2));
  context.restore();
  context.fillStyle = '#8a6900';
  context.font = `600 ${Math.max(8, mmY(2.6))}px system-ui, sans-serif`;
  context.fillText('5 mm safe margin', mmX(7), mmY(10));

  const { square, horizontalRuler, verticalRuler } = layout;
  context.strokeStyle = '#232522';
  context.lineWidth = line;
  context.strokeRect(mmX(square.xMm), mmY(square.yMm), mmX(square.sizeMm), mmY(square.sizeMm));
  context.fillStyle = '#232522';
  context.font = `700 ${Math.max(9, mmY(3.4))}px system-ui, sans-serif`;
  context.fillText('100 × 100 mm square', mmX(square.xMm), mmY(square.yMm + square.sizeMm + 7));

  drawHorizontalRuler(context, horizontalRuler.xMm, horizontalRuler.yMm, horizontalRuler.lengthMm, sx, sy);
  drawVerticalRuler(context, verticalRuler.xMm, verticalRuler.yMm, verticalRuler.lengthMm, sx, sy);

  context.font = `400 ${Math.max(8, mmY(2.8))}px system-ui, sans-serif`;
  context.fillText('If measurements differ, check the printer dialog for scaling before changing the layout.', mmX(15), mmY(270));
  context.restore();
}

function drawHorizontalRuler(
  context: CanvasRenderingContext2D,
  xMm: number,
  yMm: number,
  lengthMm: number,
  sx: number,
  sy: number,
): void {
  const x = xMm * sx;
  const y = yMm * sy;
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo((xMm + lengthMm) * sx, y);
  for (let mm = 0; mm <= lengthMm; mm += 10) {
    context.moveTo((xMm + mm) * sx, y);
    context.lineTo((xMm + mm) * sx, y - (mm % 50 === 0 ? 5 : 3) * sy);
  }
  context.stroke();
  context.font = `600 ${Math.max(8, 2.8 * sy)}px system-ui, sans-serif`;
  context.fillText('100 mm horizontal ruler', x, y - 7 * sy);
  context.fillText('0', x - sx, y + 5 * sy);
  context.fillText('100 mm', (xMm + lengthMm - 10) * sx, y + 5 * sy);
}

function drawVerticalRuler(
  context: CanvasRenderingContext2D,
  xMm: number,
  yMm: number,
  lengthMm: number,
  sx: number,
  sy: number,
): void {
  const x = xMm * sx;
  const y = yMm * sy;
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x, (yMm + lengthMm) * sy);
  for (let mm = 0; mm <= lengthMm; mm += 10) {
    context.moveTo(x, (yMm + mm) * sy);
    context.lineTo(x + (mm % 50 === 0 ? 5 : 3) * sx, (yMm + mm) * sy);
  }
  context.stroke();
  context.save();
  context.translate(x + 12 * sx, y + 50 * sy);
  context.rotate(Math.PI / 2);
  context.font = `600 ${Math.max(8, 2.8 * sy)}px system-ui, sans-serif`;
  context.textAlign = 'center';
  context.fillText('100 mm vertical ruler', 0, 0);
  context.restore();
}
