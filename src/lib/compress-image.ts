/**
 * Compresses an image file using the Canvas API.
 * Resizes to fit within maxDimension and re-encodes at the given quality.
 * Returns the original file if it's already small enough or not a compressible type.
 */
export async function compressImage(
  file: File,
  options: {
    maxDimension?: number;
    quality?: number;
    /** Skip compression if file is already under this size in bytes */
    skipUnder?: number;
  } = {}
): Promise<File> {
  const {
    maxDimension = 2048,
    quality = 0.85,
    skipUnder = 1024 * 1024, // 1MB
  } = options;

  // Only compress raster image types
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  // Skip if already small
  if (file.size <= skipUnder) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down if exceeds max dimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round(height * (maxDimension / width));
          width = maxDimension;
        } else {
          width = Math.round(width * (maxDimension / height));
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            // Compression didn't help, use original
            resolve(file);
            return;
          }

          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
            type: "image/webp",
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}
