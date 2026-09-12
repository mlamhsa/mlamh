import sharp from "sharp";

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
const MAX_INPUT_PIXELS = 40_000_000;
const MAX_DIMENSION = 12_000;

type DetectedImage = "jpeg" | "png" | "webp";

export type SanitizedRasterImage = {
  buffer: Buffer;
  extension: "jpg" | "png" | "webp";
  contentType: "image/jpeg" | "image/png" | "image/webp";
};

function detectImageType(bytes: Uint8Array): DetectedImage | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }

  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "webp";
  }

  return null;
}

function declaredTypeMatches(fileType: string, detectedType: DetectedImage) {
  if (detectedType === "jpeg") return fileType === "image/jpeg";
  if (detectedType === "png") return fileType === "image/png";
  return fileType === "image/webp";
}

export async function sanitizeRasterImage(
  file: File,
  maxBytes = DEFAULT_MAX_BYTES,
): Promise<SanitizedRasterImage> {
  if (file.size <= 0 || file.size > maxBytes) {
    throw new Error("INVALID_IMAGE_SIZE");
  }

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("INVALID_IMAGE_MIME");
  }

  const input = Buffer.from(await file.arrayBuffer());
  const detectedType = detectImageType(input);

  if (!detectedType || !declaredTypeMatches(file.type, detectedType)) {
    throw new Error("INVALID_IMAGE_SIGNATURE");
  }

  let metadata: { width?: number; height?: number };
  try {
    metadata = await sharp(input, {
      failOn: "error",
      limitInputPixels: MAX_INPUT_PIXELS,
      sequentialRead: true,
    }).metadata();
  } catch {
    throw new Error("INVALID_IMAGE_DATA");
  }

  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (
    width <= 0 ||
    height <= 0 ||
    width > MAX_DIMENSION ||
    height > MAX_DIMENSION ||
    width * height > MAX_INPUT_PIXELS
  ) {
    throw new Error("INVALID_IMAGE_DIMENSIONS");
  }

  const pipeline = sharp(input, {
    failOn: "error",
    limitInputPixels: MAX_INPUT_PIXELS,
    sequentialRead: true,
  }).rotate();

  let result: SanitizedRasterImage;

  if (detectedType === "jpeg") {
    result = {
      buffer: await pipeline.jpeg({ quality: 90, mozjpeg: true }).toBuffer(),
      extension: "jpg",
      contentType: "image/jpeg",
    };
  } else if (detectedType === "png") {
    result = {
      buffer: await pipeline.png({ compressionLevel: 9 }).toBuffer(),
      extension: "png",
      contentType: "image/png",
    };
  } else {
    result = {
      buffer: await pipeline.webp({ quality: 90 }).toBuffer(),
      extension: "webp",
      contentType: "image/webp",
    };
  }

  if (result.buffer.length <= 0 || result.buffer.length > maxBytes) {
    throw new Error("SANITIZED_IMAGE_TOO_LARGE");
  }

  return result;
}
