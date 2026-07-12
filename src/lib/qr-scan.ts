"use client";

import jsQR from "jsqr";

export async function decodeQrFromImageFile(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) return null;

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const result = jsQR(imageData.data, imageData.width, imageData.height);

  return result?.data ?? null;
}

/** Slovak IČO is an 8-digit identifier; e-kasa QR payloads typically embed it in the URL. */
export function extractIcoCandidates(text: string): string[] {
  const matches = text.match(/\b\d{8}\b/g) ?? [];
  return Array.from(new Set(matches));
}

export async function fileToBase64(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return dataUrl.split(",")[1] ?? "";
}
