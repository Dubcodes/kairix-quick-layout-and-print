# Print export

## Exact dimensions

Raster dimensions are calculated independently for each axis:

```text
pixels = round(millimetres ÷ 25.4 × DPI)
```

For A4 portrait at 300 DPI:

```text
width  = round(210 ÷ 25.4 × 300) = 2480 px
height = round(297 ÷ 25.4 × 300) = 3508 px
```

The screen preview is never scaled up for export. `renderPageToPng` allocates a new canvas at the exact final dimensions, fills the white paper background, and redraws every placement from its original decoded source.

## Fit and fill

- **Fit** keeps the complete source visible and centres any unused area inside the frame.
- **Fill** covers the frame and applies a centred crop to the source.

The same geometry utility drives preview behaviour and the export renderer. A future crop feature can replace the centred crop with explicit normalized crop coordinates without changing the page unit system.

## Resolution metadata

Browser canvas PNG encoders do not reliably add a physical print density. After encoding, the application inserts a standards-based PNG `pHYs` chunk immediately after `IHDR`.

At 300 DPI it records `11,811` pixels per metre on both axes, with the unit flag set to metres. The PNG therefore carries both exact pixel dimensions and its intended physical density. Software that ignores metadata may still scale during printing, so users should select 100% or actual-size output in the printer dialog.

## Direct printing

The Print action calls the unchanged `renderPageToPng` production renderer, so it uses the selected physical paper size and DPI plus each original decoded photograph—not the scaled editor preview. The resulting PNG is the only visible content in a temporary isolated print document. Its CSS uses matching millimetre dimensions and an `@page` size with zero margins, excluding the editor, guides, selection controls, messages and page shadow.

Browser and printer-driver support for physical CSS sizes varies. Users should choose Actual Size or 100%, disable Fit to page or Scale to fit, and verify results with the calibration utility. Export PNG is the fallback for applications or drivers that handle browser printing poorly.

## Print-quality warning

Effective source PPI is calculated from each image's intrinsic pixel dimensions and its physical frame size. A visible warning appears when that value is below the selected output DPI. This is an advisory quality check and does not fabricate missing detail or alter the original image.

## Current output scope

PNG is the only enabled milestone-one format. JPEG and PDF controls are visible and explicitly unavailable. All export work is local and no data is transmitted.

## Calibration utility

The small Print Calibration action switches the preview to a fixed A4 portrait sheet at 300 DPI without changing the photo layout or remembered preferences. The sheet contains a 100 × 100 mm square, horizontal and vertical 100 mm rulers, 5 mm safe-margin indicators, and Actual Size/100% printing guidance. It is rendered and exported by the same physical-unit PNG pipeline as photo layouts.
