# Kairix Quick Layout & Print

A private, offline-ready photo layout Progressive Web App. Every image is decoded, arranged and exported in the browser; the application has no backend and never uploads photos.

- Public application: [easyprint.dubcodesmedia.com](https://easyprint.dubcodesmedia.com)
- Official project page: [Dubcodes Media — Kairix Quick Layout & Print](https://www.dubcodesmedia.com/kairix/kairix-quick-layout-and-print)
- Support: [Buy Me a Coffee](https://buymeacoffee.com/dubcodes)

## Features in this milestone

- Responsive Konva editor with multiple-image selection, movement, resizing and 90° rotation
- Local drag-and-drop import across the Photos panel and page workspace
- Seeded Auto Arrange with scored, safe-margin-aware layouts and controlled corner overlap
- Fit/fill, duplicate, delete, undo and redo controls
- A4, A5, A3, Letter, 4 × 6 inch, 5 × 7 inch and custom paper sizes
- Portrait/landscape and millimetre/inch controls
- Exact local PNG export with embedded physical-resolution (`pHYs`) metadata
- Direct printing from an isolated full-resolution page using the same local renderer
- Visible low-resolution print warnings
- Built-in A4 calibration sheet with exact 100 mm square and rulers
- Accessible control tooltips and an offline-compatible `#/help` guide
- IndexedDB preference persistence and recommended-default restoration
- Installable manifest and service-worker offline shell

Photos exist only in memory for the current session. Object URLs are revoked when they are no longer reachable through the active undo/redo history, and all remaining URLs are revoked when the application closes. Photos are not stored in IndexedDB.

The supplied Dubcodes branding assets are bundled locally and served as static application files; they are never fetched from a remote image host:

- `public/assets/coffee_logo.png`
- `public/assets/dubcodes_media_logo.png`

## Local development

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Quality commands:

```bash
npm run check
npm run test
npm run test:e2e
npm run build
```

Playwright needs its Chromium browser installed once on a development machine:

```bash
npx playwright install chromium
```

The production site is generated in `dist/`. Preview it locally with `npx vite preview` if required.

## Cloudflare Pages deployment

Create a Pages project from the public GitHub repository and use:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |

No environment variables, Cloudflare Functions, D1 databases or R2 buckets are required. Cloudflare serves only static application files. HTTPS allows the service worker and installable PWA behaviour to work normally. The canonical deployed application URL is `https://easyprint.dubcodesmedia.com`.

## Privacy and scope

The repository intentionally contains no account system, analytics, advertising, cloud storage, server code or external image-processing API. See [architecture](docs/architecture.md) and [print export](docs/print-export.md) for design details.

## License

MIT
