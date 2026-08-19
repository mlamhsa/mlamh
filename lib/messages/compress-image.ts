const MAX_IMAGE_DIMENSION = 1920;
const SKIP_COMPRESSION_BELOW_BYTES = 500 * 1024;
const WEBP_QUALITY = 0.8;

const COMPRESSIBLE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function replaceExtensionWithWebp(
  fileName: string,
) {
  const lastDot = fileName.lastIndexOf(".");

  const baseName =
    lastDot > 0
      ? fileName.slice(0, lastDot)
      : fileName;

  return `${baseName}.webp`;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(
            new Error(
              "Unable to compress image.",
            ),
          );
          return;
        }

        resolve(blob);
      },
      type,
      quality,
    );
  });
}

export async function compressImageForMessage(
  file: File,
): Promise<File> {
  if (
    !COMPRESSIBLE_IMAGE_TYPES.has(file.type)
  ) {
    return file;
  }

  if (
    file.size <=
    SKIP_COMPRESSION_BELOW_BYTES
  ) {
    return file;
  }

  const bitmap =
    await createImageBitmap(file);

  try {
    let width = bitmap.width;
    let height = bitmap.height;

    const longestSide =
      Math.max(width, height);

    if (
      longestSide >
      MAX_IMAGE_DIMENSION
    ) {
      const ratio =
        MAX_IMAGE_DIMENSION /
        longestSide;

      width = Math.round(
        width * ratio,
      );

      height = Math.round(
        height * ratio,
      );
    }

    const canvas =
      document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context =
      canvas.getContext("2d");

    if (!context) {
      return file;
    }

    context.drawImage(
      bitmap,
      0,
      0,
      width,
      height,
    );

    const compressedBlob =
      await canvasToBlob(
        canvas,
        "image/webp",
        WEBP_QUALITY,
      );

    /*
     * إذا خرجت النسخة المضغوطة أكبر من
     * الأصل، لا يوجد سبب لاستخدامها.
     */
    if (
      compressedBlob.size >= file.size
    ) {
      return file;
    }

    return new File(
      [compressedBlob],
      replaceExtensionWithWebp(
        file.name,
      ),
      {
        type: "image/webp",
        lastModified: Date.now(),
      },
    );
  } finally {
    bitmap.close();
  }
}