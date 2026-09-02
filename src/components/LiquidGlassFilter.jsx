import React, { useEffect, useMemo, useState } from 'react';
import {
  SURFACE_EQUATIONS,
  calculateDisplacementProfile,
  generateDisplacementMap,
  generateSpecularMap,
  imageDataToDataUrl
} from '../lib/liquidGlass';

/**
 * LiquidGlassFilter Component
 * Injects a physical SVG displacement & specular highlight filter into the DOM.
 * Elements can reference this via `backdropFilter: 'url(#filterId)'` or `filter: 'url(#filterId)'`.
 */
export default function LiquidGlassFilter({
  id,
  width = 200,
  height = 60,
  radius = 30,
  bezelWidth = 14,
  glassThickness = 120,
  refractiveIndex = 1.48,
  bezelType = 'convex',
  blur = 0.5,
  scaleRatio = 0.25,
  specularOpacity = 0.6,
  specularSaturation = 3
}) {
  const [displacementMapUrl, setDisplacementMapUrl] = useState('');
  const [specularMapUrl, setSpecularMapUrl] = useState('');
  const [maxDisplacement, setMaxDisplacement] = useState(1);

  const surfaceFn = useMemo(() => {
    return SURFACE_EQUATIONS[bezelType] || SURFACE_EQUATIONS.convex;
  }, [bezelType]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const timeout = setTimeout(() => {
      try {
        const profile = calculateDisplacementProfile(glassThickness, bezelWidth, surfaceFn, refractiveIndex, 128);
        const { imageData: dispData, maxDisplacement: maxDisp } = generateDisplacementMap({
          width,
          height,
          radius,
          bezelWidth,
          displacementProfile: profile,
          dpr: 1
        });
        const specData = generateSpecularMap({
          width,
          height,
          radius,
          bezelWidth,
          specularAngle: Math.PI / 3,
          dpr: 1
        });

        setMaxDisplacement(maxDisp);
        setDisplacementMapUrl(imageDataToDataUrl(dispData));
        setSpecularMapUrl(imageDataToDataUrl(specData));
      } catch (err) {
        console.warn('LiquidGlassFilter generation error:', err);
      }
    }, 16);

    return () => clearTimeout(timeout);
  }, [width, height, radius, bezelWidth, glassThickness, refractiveIndex, surfaceFn]);

  const scale = maxDisplacement * scaleRatio;

  return (
    <svg
      aria-hidden="true"
      colorInterpolationFilters="sRGB"
      className="absolute w-0 h-0 pointer-events-none overflow-hidden"
      style={{ display: 'none' }}
    >
      <defs>
        <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
          {/* Subtle initial blur to disperse background noise */}
          <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blurred_source" />

          {/* Optical refraction displacement map */}
          {displacementMapUrl && (
            <>
              <feImage
                href={displacementMapUrl}
                x="0"
                y="0"
                width={width}
                height={height}
                result="displacement_map"
              />
              <feDisplacementMap
                in="blurred_source"
                in2="displacement_map"
                scale={scale}
                xChannelSelector="R"
                yChannelSelector="G"
                result="displaced"
              />
            </>
          )}

          {/* Vibrancy & saturation boost in refracted regions */}
          <feColorMatrix
            in={displacementMapUrl ? 'displaced' : 'blurred_source'}
            type="saturate"
            values={specularSaturation.toString()}
            result="displaced_saturated"
          />

          {/* Specular highlight rim */}
          {specularMapUrl ? (
            <>
              <feImage
                href={specularMapUrl}
                x="0"
                y="0"
                width={width}
                height={height}
                result="specular_layer"
              />
              <feComposite
                in="displaced_saturated"
                in2="specular_layer"
                operator="in"
                result="specular_saturated"
              />
              <feComponentTransfer in="specular_layer" result="specular_faded">
                <feFuncA type="linear" slope={specularOpacity} />
              </feComponentTransfer>
              <feBlend
                in="specular_saturated"
                in2={displacementMapUrl ? 'displaced' : 'blurred_source'}
                mode="normal"
                result="withSaturation"
              />
              <feBlend in="specular_faded" in2="withSaturation" mode="normal" />
            </>
          ) : (
            <feBlend
              in="displaced_saturated"
              in2={displacementMapUrl ? 'displaced' : 'blurred_source'}
              mode="normal"
            />
          )}
        </filter>
      </defs>
    </svg>
  );
}
