import assert from "node:assert/strict";
import test from "node:test";

import {
  constantTimeSecretEqual,
  hasValidBearerSecret,
  readTextBodyWithLimit,
  RequestBodyTooLargeError,
} from "./request-guards.ts";

test("readTextBodyWithLimit returns a small request body", async () => {
  const request = new Request("https://mlamh.test/api", {
    method: "POST",
    body: "hello",
  });

  assert.equal(await readTextBodyWithLimit(request, 16), "hello");
});

test("readTextBodyWithLimit rejects an oversized Content-Length before reading", async () => {
  const request = new Request("https://mlamh.test/api", {
    method: "POST",
    headers: { "content-length": "9999" },
    body: "small",
  });

  await assert.rejects(
    () => readTextBodyWithLimit(request, 64),
    RequestBodyTooLargeError,
  );
});

test("readTextBodyWithLimit rejects a stream that exceeds the limit without Content-Length", async () => {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode("1234"));
      controller.enqueue(encoder.encode("5678"));
      controller.close();
    },
  });

  const request = new Request("https://mlamh.test/api", {
    method: "POST",
    body,
    // Required by Node's fetch implementation for streaming request bodies.
    duplex: "half",
  } as RequestInit & { duplex: "half" });

  await assert.rejects(
    () => readTextBodyWithLimit(request, 6),
    RequestBodyTooLargeError,
  );
});

test("constant-time helpers accept only the exact secret", () => {
  assert.equal(constantTimeSecretEqual("correct-secret", "correct-secret"), true);
  assert.equal(constantTimeSecretEqual("wrong-secret", "correct-secret"), false);
  assert.equal(constantTimeSecretEqual(null, "correct-secret"), false);

  assert.equal(
    hasValidBearerSecret("Bearer correct-secret", "correct-secret"),
    true,
  );
  assert.equal(
    hasValidBearerSecret("Bearer wrong-secret", "correct-secret"),
    false,
  );
  assert.equal(hasValidBearerSecret("Basic correct-secret", "correct-secret"), false);
});
