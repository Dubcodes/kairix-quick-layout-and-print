# Architecture

## Boundaries

Kairix Quick Layout & Print is a static client-side application. Cloudflare Pages serves the compiled files; all document state, original image bytes, preview rendering and export rendering remain inside the browser.

The implementation separates five responsibilities:

1. `src/models` defines paper, export, placed-image and source-asset interfaces.
2. `src/features/canvas` renders a screen-resolution editor with React Konva.
3. `src/features/export` creates an independent full-resolution canvas from the physical page model and original decoded image sources.
4. `src/storage` persists only ordinary print preferences in IndexedDB.
5. `src/components` contains the responsive controls and status presentation.

## Geometry model

Paper is stored in millimetres. A placed photograph frame uses normalized page coordinates where `0` is the top or left page edge and `1` is the bottom or right page edge. No document geometry depends on current screen pixels.

The preview converts normalized geometry into the measured Konva stage size. Export converts the same geometry directly into final output pixels derived from paper dimensions and DPI. Consequently, changing the viewport does not alter the print layout.

`PlacedImage` already contains explicit `crop`, `locked` and `autoLayoutEligible` fields. They establish future model compatibility without exposing incomplete crop, lock or automatic-layout experiences.

## Image lifecycle

Import accepts JPEG, PNG and WebP. Each valid `File` is retained as an `ImageAsset` alongside its full-resolution decoded `HTMLImageElement`. A temporary object URL supplies the thumbnail and preview. Failed decodes revoke their URL immediately. Successful URLs remain available while the current layout or undo/redo history can still reference them, then are revoked as obsolete. Any remaining URLs are revoked when the app unmounts.

Photos are intentionally absent from IndexedDB. Reloading closes the session and discards image data. Only paper preset, custom size, orientation, display units and DPI are persisted.

## Editing and history

Konva nodes are a view of the immutable page model. Drag and transform completion produces a new normalized frame. Undo and redo keep bounded page-model snapshots; source assets remain separate so history snapshots do not duplicate large image data.

Low-resolution warnings compare intrinsic image pixels with its physical placement size. Export remains available because the user may intentionally accept the tradeoff, but enlargement is never silent.

## Offline behaviour

The web manifest makes the application installable. In production, `src/main.tsx` registers `public/sw.js`, which caches the application shell and same-origin assets after successful requests. The service worker contains no upload or synchronization logic.

Development mode explicitly unregisters an existing service worker and removes Kairix application caches so an earlier production preview cannot mask current Vite updates.
