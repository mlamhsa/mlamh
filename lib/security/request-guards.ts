import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

export class RequestBodyTooLargeError extends Error {
  constructor() {
    super("Request body exceeds the configured limit.");
    this.name = "RequestBodyTooLargeError";
  }
}

export async function readTextBodyWithLimit(request: Request, maxBytes: number) {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const parsedLength = Number(contentLength);
    if (Number.isFinite(parsedLength) && parsedLength > maxBytes) {
      throw new RequestBodyTooLargeError();
    }
  }

  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        throw new RequestBodyTooLargeError();
      }

      chunks.push(value);
    }
  } catch (error) {
    try {
      await reader.cancel();
    } catch {
      // Ignore cancellation errors; the original error is more useful.
    }
    throw error;
  }

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8");
}

export function constantTimeSecretEqual(candidate: string | null, expected: string) {
  if (!candidate) return false;

  const candidateDigest = createHash("sha256").update(candidate, "utf8").digest();
  const expectedDigest = createHash("sha256").update(expected, "utf8").digest();

  return timingSafeEqual(candidateDigest, expectedDigest);
}

export function hasValidBearerSecret(authorization: string | null, expectedSecret: string) {
  if (!authorization?.startsWith("Bearer ")) return false;
  const candidate = authorization.slice("Bearer ".length);
  return constantTimeSecretEqual(candidate, expectedSecret);
}
