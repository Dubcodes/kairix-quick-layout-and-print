function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint32(target: Uint8Array, offset: number, value: number): void {
  new DataView(target.buffer, target.byteOffset, target.byteLength).setUint32(offset, value, false);
}

export function addPngPhysicalResolution(png: ArrayBuffer, dpi: number): ArrayBuffer {
  const input = new Uint8Array(png);
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (input.length < 33 || !signature.every((value, index) => input[index] === value)) return png;

  const pixelsPerMetre = Math.round((dpi / 25.4) * 1000);
  const type = new TextEncoder().encode('pHYs');
  const data = new Uint8Array(9);
  writeUint32(data, 0, pixelsPerMetre);
  writeUint32(data, 4, pixelsPerMetre);
  data[8] = 1;

  const chunk = new Uint8Array(4 + type.length + data.length + 4);
  writeUint32(chunk, 0, data.length);
  chunk.set(type, 4);
  chunk.set(data, 8);
  const crcInput = new Uint8Array(type.length + data.length);
  crcInput.set(type);
  crcInput.set(data, type.length);
  writeUint32(chunk, 17, crc32(crcInput));

  const output = new Uint8Array(input.length + chunk.length);
  output.set(input.subarray(0, 33));
  output.set(chunk, 33);
  output.set(input.subarray(33), 33 + chunk.length);
  return output.buffer;
}
