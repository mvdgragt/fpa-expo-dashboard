const blobToArrayBuffer = (blob: Blob) => blob.arrayBuffer();

const loadBitmap = async (file: File) => {
  if ("createImageBitmap" in window) {
    return await createImageBitmap(file);
  }

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load image"));
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(img, 0, 0);

    return await createImageBitmap(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
};

const drawToCanvas = (bitmap: ImageBitmap, maxDim: number) => {
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas;
};

const canvasToJpegBlob = async (canvas: HTMLCanvasElement, quality: number) => {
  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) throw new Error("Failed to encode image");
  return blob;
};

export const compressImageToMaxBytes = async (args: {
  file: File;
  maxBytes: number;
  maxDim?: number;
}): Promise<File> => {
  const maxDim = args.maxDim ?? 640;

  const bitmap = await loadBitmap(args.file);
  try {
    let currentMaxDim = maxDim;

    for (let dimAttempt = 0; dimAttempt < 3; dimAttempt++) {
      const canvas = drawToCanvas(bitmap, currentMaxDim);

      let qLow = 0.35;
      let qHigh = 0.9;
      let best: Blob | null = null;

      for (let i = 0; i < 8; i++) {
        const q = (qLow + qHigh) / 2;
        const blob = await canvasToJpegBlob(canvas, q);

        if (blob.size <= args.maxBytes) {
          best = blob;
          qLow = q;
        } else {
          qHigh = q;
        }
      }

      const finalBlob = best ?? (await canvasToJpegBlob(canvas, qLow));
      if (finalBlob.size <= args.maxBytes) {
        const ab = await blobToArrayBuffer(finalBlob);
        return new File([ab], "photo.jpg", { type: "image/jpeg" });
      }

      currentMaxDim = Math.max(240, Math.round(currentMaxDim * 0.75));
    }

    const fallbackCanvas = drawToCanvas(bitmap, 240);
    const blob = await canvasToJpegBlob(fallbackCanvas, 0.4);
    const ab = await blobToArrayBuffer(blob);
    return new File([ab], "photo.jpg", { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
};
