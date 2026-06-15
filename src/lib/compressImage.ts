// Compress an image File to approximately ~40KB returning a data URL (JPEG).
export async function compressImage(file: File, targetKB = 40): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  const img = await loadImage(dataUrl);

  let maxDim = 1200;
  let quality = 0.8;
  const targetBytes = targetKB * 1024;

  for (let attempt = 0; attempt < 10; attempt++) {
    const { width, height } = fit(img.width, img.height, maxDim);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, width, height);
    const out = canvas.toDataURL("image/jpeg", quality);
    const bytes = Math.ceil((out.length - "data:image/jpeg;base64,".length) * 0.75);

    if (bytes <= targetBytes || (maxDim <= 320 && quality <= 0.35)) {
      return out;
    }
    if (quality > 0.4) quality -= 0.1;
    else {
      maxDim = Math.max(320, Math.floor(maxDim * 0.8));
      quality = 0.7;
    }
  }
  // Fallback last attempt
  const canvas = document.createElement("canvas");
  const { width, height } = fit(img.width, img.height, 480);
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.4);
}

function fit(w: number, h: number, max: number) {
  if (w <= max && h <= max) return { width: w, height: h };
  const r = w / h;
  return r > 1
    ? { width: max, height: Math.round(max / r) }
    : { width: Math.round(max * r), height: max };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}
