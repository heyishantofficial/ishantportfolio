/**
 * Liquid Glass Physics & Refraction Engine
 * Adapted from Apple interface experiments & vue-web-liquid-glass
 * Provides physical Snell's law refraction displacement maps and specular reflection maps.
 */

export const SURFACE_EQUATIONS = {
  convex: (x) => Math.sqrt(Math.max(0, 1 - (1 - x) ** 2)),
  concave: (x) => 1 - Math.sqrt(Math.max(0, 1 - x ** 2)),
  lip: (x) => 0.5 - 0.5 * Math.cos(x * Math.PI)
};

/**
 * Pre-computes ray refraction deviation across a curved glass bezel.
 */
export function calculateDisplacementProfile(
  glassThickness = 120,
  bezelWidth = 30,
  bezelHeightFn = SURFACE_EQUATIONS.convex,
  refractiveIndex = 1.48,
  samples = 128
) {
  const eta = 1 / refractiveIndex;

  function refract(normalX, normalY) {
    const dot = normalY;
    const k = 1 - eta * eta * (1 - dot * dot);
    if (k < 0) return null; // Total internal reflection
    const kSqrt = Math.sqrt(k);
    return [
      -(eta * dot + kSqrt) * normalX,
      eta - (eta * dot + kSqrt) * normalY
    ];
  }

  return Array.from({ length: samples }, (_, i) => {
    const x = i / samples;
    const y = bezelHeightFn(x);
    const dx = x < 1 ? 0.0001 : -0.0001;
    const y2 = bezelHeightFn(x + dx);
    const derivative = (y2 - y) / dx;
    const magnitude = Math.sqrt(derivative * derivative + 1);
    const normal = [-derivative / magnitude, -1 / magnitude];
    const refracted = refract(normal[0], normal[1]);

    if (!refracted) return 0;
    const remainingHeightOnBezel = y * bezelWidth;
    const remainingHeight = remainingHeightOnBezel + glassThickness;
    return refracted[0] * (remainingHeight / refracted[1]);
  });
}

/**
 * Generates an ImageData displacement map (R = X displacement, G = Y displacement).
 */
export function generateDisplacementMap({
  width,
  height,
  radius = 20,
  bezelWidth = 16,
  displacementProfile,
  dpr = 1
}) {
  const bufferW = Math.max(1, Math.floor(width * dpr));
  const bufferH = Math.max(1, Math.floor(height * dpr));
  const imageData = new ImageData(bufferW, bufferH);

  // Fill neutral: R=128 (0 offset), G=128 (0 offset), B=128, A=255
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 128;
    data[i + 1] = 128;
    data[i + 2] = 128;
    data[i + 3] = 255;
  }

  const radiusDpr = Math.min(radius * dpr, Math.min(bufferW, bufferH) / 2);
  const bezelDpr = Math.min(bezelWidth * dpr, radiusDpr);
  const radiusSq = radiusDpr ** 2;
  const radiusMinusBezelSq = Math.max(0, radiusDpr - bezelDpr) ** 2;
  const maxDisplacement = Math.max(1, ...displacementProfile.map((x) => Math.abs(x)));

  const innerW = bufferW - radiusDpr * 2;
  const innerH = bufferH - radiusDpr * 2;

  for (let y = 0; y < bufferH; y++) {
    for (let x = 0; x < bufferW; x++) {
      const idx = (y * bufferW + x) * 4;

      const onLeft = x < radiusDpr;
      const onRight = x >= bufferW - radiusDpr;
      const onTop = y < radiusDpr;
      const onBottom = y >= bufferH - radiusDpr;

      const px = onLeft ? x - radiusDpr : onRight ? x - radiusDpr - innerW : 0;
      const py = onTop ? y - radiusDpr : onBottom ? y - radiusDpr - innerH : 0;

      const distSq = px * px + py * py;

      if (distSq <= radiusSq && distSq >= radiusMinusBezelSq) {
        const dist = Math.sqrt(distSq) || 0.001;
        const distFromSide = radiusDpr - dist;
        const opacity = Math.min(1, Math.max(0, 1 - (dist - radiusDpr + bezelDpr) / bezelDpr));

        const cos = px / dist;
        const sin = py / dist;

        const bezelIdx = Math.min(
          displacementProfile.length - 1,
          Math.max(0, Math.floor((distFromSide / bezelDpr) * displacementProfile.length))
        );
        const distance = displacementProfile[bezelIdx] || 0;

        const dX = (-cos * distance) / maxDisplacement;
        const dY = (-sin * distance) / maxDisplacement;

        data[idx] = Math.round(128 + dX * 127 * opacity);
        data[idx + 1] = Math.round(128 + dY * 127 * opacity);
      }
    }
  }

  return { imageData, maxDisplacement };
}

/**
 * Generates a specular reflection highlight map for top-left light incidence.
 */
export function generateSpecularMap({
  width,
  height,
  radius = 20,
  bezelWidth = 14,
  specularAngle = Math.PI / 3, // ~60 deg (top-left lighting)
  dpr = 1
}) {
  const bufferW = Math.max(1, Math.floor(width * dpr));
  const bufferH = Math.max(1, Math.floor(height * dpr));
  const imageData = new ImageData(bufferW, bufferH);
  const data = imageData.data;

  const radiusDpr = Math.min(radius * dpr, Math.min(bufferW, bufferH) / 2);
  const bezelDpr = Math.min(bezelWidth * dpr, radiusDpr);
  const radiusSq = radiusDpr ** 2;
  const radiusMinusBezelSq = Math.max(0, radiusDpr - bezelDpr) ** 2;
  const lightVec = [Math.cos(specularAngle), Math.sin(specularAngle)];

  const innerW = bufferW - radiusDpr * 2;
  const innerH = bufferH - radiusDpr * 2;

  for (let y = 0; y < bufferH; y++) {
    for (let x = 0; x < bufferW; x++) {
      const idx = (y * bufferW + x) * 4;

      const onLeft = x < radiusDpr;
      const onRight = x >= bufferW - radiusDpr;
      const onTop = y < radiusDpr;
      const onBottom = y >= bufferH - radiusDpr;

      const px = onLeft ? x - radiusDpr : onRight ? x - radiusDpr - innerW : 0;
      const py = onTop ? y - radiusDpr : onBottom ? y - radiusDpr - innerH : 0;

      const distSq = px * px + py * py;

      if (distSq <= radiusSq && distSq >= radiusMinusBezelSq) {
        const dist = Math.sqrt(distSq) || 0.001;
        const distFromSide = radiusDpr - dist;
        const cos = px / dist;
        const sin = -py / dist;

        const dot = Math.abs(cos * lightVec[0] + sin * lightVec[1]);
        const coeff = dot * Math.sqrt(Math.max(0, 1 - (1 - distFromSide / (1 * dpr)) ** 2));

        const color = Math.min(255, Math.round(255 * coeff));
        const alpha = Math.min(255, Math.round(color * coeff));

        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = alpha;
      }
    }
  }

  return imageData;
}

/**
 * Converts ImageData to a reusable data URL.
 */
export function imageDataToDataUrl(imageData) {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}
