const MAX_IMAGE_WIDTH = 1600;
const MAX_IMAGE_HEIGHT = 1600;
const JPEG_QUALITY = 0.82;
const MIN_SIZE_TO_COMPRESS = 300 * 1024;

function loadImage(file: File) {
  return new Promise<HTMLImageElement>(
    (resolve, reject) => {
      const image = new Image();
      const objectUrl =
        URL.createObjectURL(file);

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);

        reject(
          new Error(
            "Could not read the selected image.",
          ),
        );
      };

      image.src = objectUrl;
    },
  );
}

function calculateDimensions(
  width: number,
  height: number,
) {
  if (
    width <= MAX_IMAGE_WIDTH &&
    height <= MAX_IMAGE_HEIGHT
  ) {
    return {
      width,
      height,
    };
  }

  const ratio = Math.min(
    MAX_IMAGE_WIDTH / width,
    MAX_IMAGE_HEIGHT / height,
  );

  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(
            new Error(
              "Could not compress the selected image.",
            ),
          );

          return;
        }

        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

function createCompressedFileName(
  originalName: string,
  mimeType: string,
) {
  const baseName =
    originalName.replace(
      /\.[^/.]+$/,
      "",
    ) || "image";

  const extension =
    mimeType === "image/webp"
      ? "webp"
      : "jpg";

  return `${baseName}.${extension}`;
}

export async function compressImage(
  file: File,
) {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  if (file.size <= MIN_SIZE_TO_COMPRESS) {
    return file;
  }

  const image = await loadImage(file);

  const dimensions =
    calculateDimensions(
      image.naturalWidth,
      image.naturalHeight,
    );

  const canvas =
    document.createElement("canvas");

  canvas.width = dimensions.width;
  canvas.height = dimensions.height;

  const context =
    canvas.getContext("2d");

  if (!context) {
    return file;
  }

  context.drawImage(
    image,
    0,
    0,
    dimensions.width,
    dimensions.height,
  );

  const outputMimeType =
    file.type === "image/png"
      ? "image/webp"
      : file.type === "image/webp"
        ? "image/webp"
        : "image/jpeg";

  const compressedBlob =
    await canvasToBlob(
      canvas,
      outputMimeType,
      JPEG_QUALITY,
    );

  if (
    compressedBlob.size >= file.size
  ) {
    return file;
  }

  return new File(
    [compressedBlob],
    createCompressedFileName(
      file.name,
      outputMimeType,
    ),
    {
      type: outputMimeType,
      lastModified: Date.now(),
    },
  );
}