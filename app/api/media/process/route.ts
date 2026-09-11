import { createHash, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

import { getRequestUser } from "@/lib/auth/request-user";
import {
  readTextBodyWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/security/request-guards";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_INPUT_BYTES = 5 * 1024 * 1024;
const MAX_INPUT_PIXELS = 40_000_000;
const MAX_DIMENSION = 12_000;
const MAX_REQUEST_BODY_BYTES = 8 * 1024;
const QUARANTINE_BUCKET = "media-quarantine";
const PUBLIC_BUCKET = "talent-media";
const ALLOWED_KINDS = new Set(["profile-images", "gallery"]);
const PROCESS_LIMIT = 30;
const PROCESS_WINDOW_SECONDS = 600;

type ImageKind = "profile-images" | "gallery";
type DetectedImage = "jpeg" | "png" | "webp";

function detectImageType(bytes: Uint8Array): DetectedImage | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
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

function isValidQuarantinePath(userId: string, kind: ImageKind, path: string) {
  const prefix = `${userId}/${kind}/`;
  if (!path.startsWith(prefix)) return false;

  const filename = path.slice(prefix.length);
  return /^[0-9a-f-]{36}\.(jpe?g|png|webp)$/i.test(filename);
}

function createUserStorageClient(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Supabase public configuration is missing.");
  }

  return createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function POST(request: Request) {
  const requestUser = await getRequestUser(request);

  if (!requestUser.ok) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const adminClient = createAdminClient();
  const rateKey = createHash("sha256")
    .update(`media-process:${requestUser.user.id}`)
    .digest("hex");

  const { data: rateRows, error: rateError } = await adminClient.rpc(
    "consume_support_rate_limit",
    {
      p_key_hash: rateKey,
      p_limit: PROCESS_LIMIT,
      p_window_seconds: PROCESS_WINDOW_SECONDS,
    },
  );

  if (rateError) {
    console.error("[api.media.process.rateLimit]", rateError);
    return Response.json({ error: "RATE_LIMIT_UNAVAILABLE" }, { status: 503 });
  }

  const rate = Array.isArray(rateRows) ? rateRows[0] : rateRows;
  if (rate && rate.allowed === false) {
    return Response.json(
      {
        error: "RATE_LIMIT",
        retryAfterSeconds: rate.retry_after_seconds ?? PROCESS_WINDOW_SECONDS,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            rate.retry_after_seconds ?? PROCESS_WINDOW_SECONDS,
          ),
        },
      },
    );
  }

  let payload: { path?: unknown; kind?: unknown };

  try {
    const rawPayload = await readTextBodyWithLimit(request, MAX_REQUEST_BODY_BYTES);
    payload = JSON.parse(rawPayload) as { path?: unknown; kind?: unknown };
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return Response.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
    }

    return Response.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  if (
    typeof payload.path !== "string" ||
    typeof payload.kind !== "string" ||
    !ALLOWED_KINDS.has(payload.kind)
  ) {
    return Response.json({ error: "INVALID_MEDIA_REQUEST" }, { status: 400 });
  }

  const kind = payload.kind as ImageKind;
  const path = payload.path;

  if (!isValidQuarantinePath(requestUser.user.id, kind, path)) {
    return Response.json({ error: "INVALID_MEDIA_PATH" }, { status: 403 });
  }

  const userStorage = createUserStorageClient(requestUser.accessToken);

  const removeQuarantinedObject = async () => {
    await userStorage.storage.from(QUARANTINE_BUCKET).remove([path]);
  };

  try {
    const { data: blob, error: downloadError } = await userStorage.storage
      .from(QUARANTINE_BUCKET)
      .download(path);

    if (downloadError || !blob) {
      return Response.json(
        { error: "QUARANTINE_OBJECT_NOT_FOUND" },
        { status: 404 },
      );
    }

    if (blob.size <= 0 || blob.size > MAX_INPUT_BYTES) {
      await removeQuarantinedObject();
      return Response.json({ error: "INVALID_IMAGE_SIZE" }, { status: 413 });
    }

    const input = Buffer.from(await blob.arrayBuffer());
    const detectedType = detectImageType(input);

    if (!detectedType) {
      await removeQuarantinedObject();
      return Response.json(
        { error: "INVALID_IMAGE_SIGNATURE" },
        { status: 415 },
      );
    }

    const metadata = await sharp(input, {
      failOn: "error",
      limitInputPixels: MAX_INPUT_PIXELS,
      sequentialRead: true,
    }).metadata();

    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;

    if (
      width <= 0 ||
      height <= 0 ||
      width > MAX_DIMENSION ||
      height > MAX_DIMENSION ||
      width * height > MAX_INPUT_PIXELS
    ) {
      await removeQuarantinedObject();
      return Response.json(
        { error: "UNSAFE_IMAGE_DIMENSIONS" },
        { status: 422 },
      );
    }

    const pipeline = sharp(input, {
      failOn: "error",
      limitInputPixels: MAX_INPUT_PIXELS,
      sequentialRead: true,
    }).rotate();

    let output: Buffer;
    let extension: "jpg" | "png" | "webp";
    let contentType: "image/jpeg" | "image/png" | "image/webp";

    if (detectedType === "jpeg") {
      output = await pipeline.jpeg({ quality: 90, mozjpeg: true }).toBuffer();
      extension = "jpg";
      contentType = "image/jpeg";
    } else if (detectedType === "png") {
      output = await pipeline.png({ compressionLevel: 9 }).toBuffer();
      extension = "png";
      contentType = "image/png";
    } else {
      output = await pipeline.webp({ quality: 90 }).toBuffer();
      extension = "webp";
      contentType = "image/webp";
    }

    if (output.length <= 0 || output.length > MAX_INPUT_BYTES) {
      await removeQuarantinedObject();
      return Response.json(
        { error: "RECONSTRUCTED_IMAGE_TOO_LARGE" },
        { status: 422 },
      );
    }

    const destinationPath = `${requestUser.user.id}/${kind}/${randomUUID()}.${extension}`;
    const { error: uploadError } = await adminClient.storage
      .from(PUBLIC_BUCKET)
      .upload(destinationPath, output, {
        cacheControl: "3600",
        contentType,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = adminClient.storage
      .from(PUBLIC_BUCKET)
      .getPublicUrl(destinationPath);

    await removeQuarantinedObject();

    return Response.json({
      publicUrl: data.publicUrl,
      contentType,
      reconstructed: true,
    });
  } catch (error) {
    await removeQuarantinedObject();
    console.error("media reconstruction failed", {
      userId: requestUser.user.id,
      kind,
      error: error instanceof Error ? error.message : "unknown_error",
    });

    return Response.json({ error: "IMAGE_PROCESSING_FAILED" }, { status: 422 });
  }
}
