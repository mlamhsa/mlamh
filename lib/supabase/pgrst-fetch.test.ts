import test from "node:test";
import assert from "node:assert/strict";

import { fetchWithPgrst303Retry } from "./pgrst-fetch.ts";

test("passes through ordinary responses without retrying", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;

  globalThis.fetch = async () => {
    calls += 1;
    return new Response("ok", { status: 200 });
  };

  try {
    const response = await fetchWithPgrst303Retry("https://example.test/rest/v1/profiles");
    assert.equal(response.status, 200);
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("retries exactly once for PGRST303 JWT issued at future", async () => {
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;
  let calls = 0;

  globalThis.fetch = async () => {
    calls += 1;
    if (calls === 1) {
      return Response.json(
        { code: "PGRST303", message: "JWT issued at future" },
        { status: 401 },
      );
    }
    return new Response("ok", { status: 200 });
  };
  console.warn = () => {};

  try {
    const response = await fetchWithPgrst303Retry("https://example.test/rest/v1/profiles");
    assert.equal(response.status, 200);
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
  }
});

test("does not retry unrelated 401 responses", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;

  globalThis.fetch = async () => {
    calls += 1;
    return Response.json(
      { code: "PGRST301", message: "Invalid JWT" },
      { status: 401 },
    );
  };

  try {
    const response = await fetchWithPgrst303Retry("https://example.test/rest/v1/profiles");
    assert.equal(response.status, 401);
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
