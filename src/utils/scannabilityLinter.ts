import type { ErrorCorrectionLevel } from '../types';

/**
 * Converts hex color string to RGB object
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r, g, b };
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

/**
 * Computes WCAG 2.1 relative luminance for an sRGB component
 */
function srgbToLinear(c: number): number {
  const norm = c / 255;
  return norm <= 0.04045 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

/**
 * Calculates WCAG 2.1 relative luminance
 */
export function getRelativeLuminance(hexColor: string): number {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return 0;
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Computes WCAG contrast ratio between two hex colors
 * Returns a number like 4.5, 7.2, 21.0
 */
export function calculateContrastRatio(fgHex: string, bgHex: string): number {
  const lum1 = getRelativeLuminance(fgHex);
  const lum2 = getRelativeLuminance(bgHex);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface ScannabilityReport {
  contrastRatio: number;
  isContrastSufficient: boolean; // >= 4.5:1
  isContrastWarning: boolean; // between 3.0 and 4.5
  isContrastFailing: boolean; // < 3.0
  isDensityWarning: boolean; // payload > 300 and ECL === 'H'
  payloadLength: number;
  recommendations: string[];
}

/**
 * Evaluates WCAG contrast and QR code scannability density
 */
export function analyzeScannability(
  fgColor: string,
  bgColor: string,
  payloadLength: number,
  ecl: ErrorCorrectionLevel
): ScannabilityReport {
  const contrastRatio = Number(calculateContrastRatio(fgColor, bgColor).toFixed(2));
  const isContrastSufficient = contrastRatio >= 4.5;
  const isContrastWarning = contrastRatio >= 3.0 && contrastRatio < 4.5;
  const isContrastFailing = contrastRatio < 3.0;

  // FR-D3: Alerts user if payload length exceeds 300 characters while Error Correction Level is set to H
  const isDensityWarning = payloadLength > 300 && ecl === 'H';

  const recommendations: string[] = [];

  if (isContrastFailing) {
    recommendations.push(
      `WCAG Contrast is critically low (${contrastRatio}:1). Mobile cameras will fail to decode this code in standard lighting. Increase contrast to at least 4.5:1.`
    );
  } else if (isContrastWarning) {
    recommendations.push(
      `Contrast ratio is marginal (${contrastRatio}:1). Aim for >= 4.5:1 for reliable scanning across all camera lenses.`
    );
  }

  // Check if inverted (light foreground on dark background)
  const fgLum = getRelativeLuminance(fgColor);
  const bgLum = getRelativeLuminance(bgColor);
  if (fgLum > bgLum) {
    recommendations.push(
      'Notice: Inverted QR codes (light code on dark background) may fail on older barcode scanners. Traditional dark-on-light is recommended for physical print.'
    );
  }

  if (isDensityWarning) {
    recommendations.push(
      `High Data Density: Payload is ${payloadLength} characters with Level 'H' error correction. This creates dense dot matrices that are hard to scan on mobile cameras. Suggest switching to Level 'M' or shortening the payload.`
    );
  }

  return {
    contrastRatio,
    isContrastSufficient,
    isContrastWarning,
    isContrastFailing,
    isDensityWarning,
    payloadLength,
    recommendations
  };
}
