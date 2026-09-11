import "server-only";

import sharp from "sharp";

const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;
const MAX_IMAGE_DIMENSION = 12_000;

const ALLOWED_EXTENSIONS: Record<string, ReadonlySet<string>> = {
  "image/jpeg": new Set(["jpg", "jpeg"]),
  "image/png": new Set(["png"]),
  "image/webp": new Set(["webp"]),
  "application/pdf": new Set(["pdf"]),
  "application/msword": new Set(["doc"]),
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": new Set(["docx"]),
  "audio/webm": new Set(["webm"]),
  "audio/webm;codecs=opus": new Set(["webm"]),
  "audio/mp4": new Set(["m4a", "mp4"]),
};

export type SafeMessageAttachment = {
  buffer: Buffer;
  contentType: string;
  storageExtension: string;
  displayName: string;
  sizeBytes: number;
};

function extensionOf(name: string) {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? "";
}

function cleanDisplayName(name: string) {
  const normalized = name
    .normalize("NFKC")
    .replace(/[\\/\0]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  return (normalized || "attachment").slice(0, 255);
}

function startsWithBytes(buffer: Buffer, signature: readonly number[]) {
  if (buffer.length < signature.length) return false;
  return signature.every((byte, index) => buffer[index] === byte);
}

function hasZipSignature(buffer: Buffer) {
  return (
    startsWithBytes(buffer, [0x50, 0x4b, 0x03, 0x04]) ||
    startsWithBytes(buffer, [0x50, 0x4b, 0x05, 0x06]) ||
    startsWithBytes(buffer, [0x50, 0x4b, 0x07, 0x08])
  );
}

function hasOleSignature(buffer: Buffer) {
  return startsWithBytes(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
}

function containsAscii(buffer: Buffer, value: string) {
  return buffer.indexOf(Buffer.from(value, "ascii")) !== -1;
}

function isWebm(buffer: Buffer) {
  return startsWithBytes(buffer, [0x1a, 0x45, 0xdf, 0xa3]);
}

function isMp4Family(buffer: Buffer) {
  return buffer.length >= 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp";
}

function signatureMatches(mimeType: string, buffer: Buffer) {
  switch (mimeType) {
    case "image/jpeg":
      return startsWithBytes(buffer, [0xff, 0xd8, 0xff]);
    case "image/png":
      return startsWithBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/webp":
      return (
        buffer.length >= 12 &&
        buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
        buffer.subarray(8, 12).toString("ascii") === "WEBP"
      );
    case "application/pdf":
      return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
    case "application/msword":
      return hasOleSignature(buffer);
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return hasZipSignature(buffer) && containsAscii(buffer, "[Content_Types].xml") && containsAscii(buffer, "word/");
    case "audio/webm":
    case "audio/webm;codecs=opus":
      return isWebm(buffer);
    case "audio/mp4":
      return isMp4Family(buffer);
    default:
      return false;
  }
}

async function reconstructImage(
  mimeType: "image/jpeg" | "image/png" | "image/webp",
  buffer: Buffer,
) {
  const metadata = await sharp(buffer, {
    failOn: "error",
    limitInputPixels: MAX_IMAGE_PIXELS,
    sequentialRead: true,
  }).metadata();

  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (
    width <= 0 ||
    height <= 0 ||
    width > MAX_IMAGE_DIMENSION ||
    height > MAX_IMAGE_DIMENSION ||
    width * height > MAX_IMAGE_PIXELS
  ) {
    throw new Error("Unsupported image dimensions.");
  }

  const pipeline = sharp(buffer, {
    failOn: "error",
    limitInputPixels: MAX_IMAGE_PIXELS,
    sequentialRead: true,
  }).rotate();

  if (mimeType === "image/jpeg") {
    return {
      buffer: await pipeline.jpeg({ quality: 90, mozjpeg: true }).toBuffer(),
      contentType: "image/jpeg",
      storageExtension: ".jpg",
    } as const;
  }
  if (mimeType === "image/png") {
    return {
      buffer: await pipeline.png({ compressionLevel: 9 }).toBuffer(),
      contentType: "image/png",
      storageExtension: ".png",
    } as const;
  }
  return {
    buffer: await pipeline.webp({ quality: 90 }).toBuffer(),
    contentType: "image/webp",
    storageExtension: ".webp",
  } as const;
}

export async function validateAndSanitizeMessageAttachment(file: File): Promise<SafeMessageAttachment> {
  if (file.size <= 0 || file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    throw new Error("Attachment size must be between 1 byte and 10 MB.");
  }

  const allowedExtensions = ALLOWED_EXTENSIONS[file.type];
  if (!allowedExtensions) {
    throw new Error("Unsupported attachment type.");
  }

  const extension = extensionOf(file.name);
  if (!extension || !allowedExtensions.has(extension)) {
    throw new Error("Attachment extension does not match the declared file type.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length !== file.size || !signatureMatches(file.type, buffer)) {
    throw new Error("Attachment signature does not match the declared file type.");
  }

  const displayName = cleanDisplayName(file.name);

  if (file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp") {
    let reconstructed;
    try {
      reconstructed = await reconstructImage(file.type, buffer);
    } catch {
      throw new Error("Image attachment is invalid or corrupted.");
    }

    if (reconstructed.buffer.length <= 0 || reconstructed.buffer.length > MAX_ATTACHMENT_SIZE_BYTES) {
      throw new Error("Reconstructed image exceeds the 10 MB attachment limit.");
    }

    return {
      buffer: reconstructed.buffer,
      contentType: reconstructed.contentType,
      storageExtension: reconstructed.storageExtension,
      displayName,
      sizeBytes: reconstructed.buffer.length,
    };
  }

  return {
    buffer,
    contentType: file.type,
    storageExtension: `.${extension}`,
    displayName,
    sizeBytes: buffer.length,
  };
}
