// Valid 1 × 1 PNG files kept in source form so the E2E test can upload real fixture images.
const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

export const imageFixtures = ['portrait.png', 'landscape.png', 'square.png'].map((name) => ({
  name,
  mimeType: 'image/png',
  buffer: Buffer.from(PNG_BASE64, 'base64'),
}));
