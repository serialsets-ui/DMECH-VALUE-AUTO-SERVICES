// Browser-only image processing for vehicle photos — HEIC decode, resize,
// optional crop, optional watermark, WebP re-encode. Runs entirely via
// Canvas in the staff member's browser, never on the server: this machine
// (and Netlify's function runtime) has a real memory ceiling, and a
// server-side sharp/libvips pipeline would be a genuine reliability risk
// that a client-side Canvas pipeline sidesteps completely. Only ever import
// this from a "use client" component.

const MAX_DIMENSION = 1920;
const DEFAULT_QUALITY = 0.82;
const HEIC_TYPES = ["image/heic", "image/heif"];

export function isHeic(file: File): boolean {
  return HEIC_TYPES.includes(file.type) || /\.hei[cf]$/i.test(file.name);
}

// Dynamically imported so the WASM HEIC decoder never bloats the initial
// bundle for staff who never touch an iPhone photo.
async function convertHeicToJpeg(file: File): Promise<Blob> {
  const heic2any = (await import("heic2any")).default;
  const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
  return Array.isArray(result) ? result[0] : result;
}

async function loadForProcessing(file: File): Promise<ImageBitmap> {
  const source = isHeic(file) ? await convertHeicToJpeg(file) : file;
  return createImageBitmap(source);
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ProcessOptions {
  cropRect?: CropRect;
  watermark?: boolean;
  maxDimension?: number;
  quality?: number;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function processImage(file: File, options: ProcessOptions = {}): Promise<Blob> {
  const bitmap = await loadForProcessing(file);
  const srcX = options.cropRect?.x ?? 0;
  const srcY = options.cropRect?.y ?? 0;
  const srcW = options.cropRect?.width ?? bitmap.width;
  const srcH = options.cropRect?.height ?? bitmap.height;

  const maxDim = options.maxDimension ?? MAX_DIMENSION;
  const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
  const outW = Math.max(1, Math.round(srcW * scale));
  const outH = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported.");
  ctx.drawImage(bitmap, srcX, srcY, srcW, srcH, 0, 0, outW, outH);
  bitmap.close();

  if (options.watermark) {
    await drawWatermark(ctx, outW, outH);
  }

  const quality = options.quality ?? DEFAULT_QUALITY;
  const blob = (await canvasToBlob(canvas, "image/webp", quality)) ?? (await canvasToBlob(canvas, "image/jpeg", quality));
  if (!blob) throw new Error("Could not encode image.");
  return blob;
}

let watermarkLogo: HTMLImageElement | null | undefined;
async function loadWatermarkLogo(): Promise<HTMLImageElement | null> {
  if (watermarkLogo !== undefined) return watermarkLogo;
  try {
    const img = new Image();
    img.src = "/logo.png";
    await img.decode();
    watermarkLogo = img;
  } catch {
    watermarkLogo = null;
  }
  return watermarkLogo;
}

async function drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const logo = await loadWatermarkLogo();
  const pad = Math.round(width * 0.02);
  ctx.save();
  ctx.globalAlpha = 0.55;
  if (logo) {
    const logoW = Math.round(width * 0.16);
    const logoH = Math.round((logo.height / logo.width) * logoW);
    ctx.drawImage(logo, width - logoW - pad, height - logoH - pad, logoW, logoH);
  } else {
    const fontSize = Math.max(12, Math.round(width * 0.03));
    ctx.font = `700 ${fontSize}px sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.shadowColor = "rgba(0,0,0,.6)";
    ctx.shadowBlur = 4;
    ctx.fillText("DMECH", width - pad, height - pad);
  }
  ctx.restore();
}
