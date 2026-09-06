/**
 * Apple .icns Binary Parser
 * Extracts the highest-resolution PNG image embedded in a macOS .icns container.
 * Modern macOS .icns files store icons as standard PNG chunks (ic07, ic08, ic09, ic10, etc.)
 */

export async function parseIcnsToPngBlob(fileOrBuffer) {
  const buffer = fileOrBuffer instanceof ArrayBuffer ? fileOrBuffer : await fileOrBuffer.arrayBuffer();
  if (buffer.byteLength < 8) {
    throw new Error('File too small to be a valid .icns file.');
  }

  const view = new DataView(buffer);
  const magic = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  if (magic !== 'icns') {
    throw new Error('Invalid .icns format (magic header mismatch).');
  }

  let offset = 8;
  const pngs = [];

  while (offset + 8 <= buffer.byteLength) {
    const type = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    );
    const len = view.getUint32(offset + 4);

    if (len <= 8 || offset + len > buffer.byteLength) {
      break;
    }

    const chunkData = new Uint8Array(buffer, offset + 8, len - 8);

    // Verify PNG magic signature: 0x89 0x50 0x4E 0x47 (‰PNG)
    if (
      chunkData.length >= 8 &&
      chunkData[0] === 0x89 &&
      chunkData[1] === 0x50 &&
      chunkData[2] === 0x4e &&
      chunkData[3] === 0x47
    ) {
      pngs.push({
        type,
        size: chunkData.length,
        data: chunkData
      });
    }

    offset += len;
  }

  if (pngs.length === 0) {
    throw new Error('No embedded PNG image found inside this .icns file. Please upload a modern macOS .icns or PNG file.');
  }

  // Sort by chunk length descending to pick highest resolution (e.g. ic10 1024x1024 or ic09 512x512)
  pngs.sort((a, b) => b.size - a.size);
  const bestPng = pngs[0];

  return new Blob([bestPng.data], { type: 'image/png' });
}

/**
 * Normalizes any icon file (.icns, .png, .jpg, .svg, .webp, .ico).
 * If .icns, unpacks to retina PNG Blob and returns as File.
 */
export async function processIconFile(file) {
  const isIcns = file.name.toLowerCase().endsWith('.icns') || file.type === 'image/x-icns';

  if (isIcns) {
    const pngBlob = await parseIcnsToPngBlob(file);
    const safeName = file.name.replace(/\.icns$/i, '') + '.png';
    return new File([pngBlob], safeName, { type: 'image/png' });
  }

  return file;
}

/**
 * Converts a File or Blob into base64 data URL
 */
export function fileToBase64(fileOrBlob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(fileOrBlob);
  });
}
