#!/usr/bin/env node
// Public production smoke check. Read-only; no credentials or database writes.
const base = (process.env.SMOKE_BASE_URL || 'https://mlamh.net').replace(/\/$/, '');
const paths = [
  '/ar', '/en',
  '/ar/talent', '/en/talent',
  '/ar/opportunities', '/en/opportunities',
  '/ar/login', '/en/login',
  '/ar/join', '/en/join',
];
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 15000);
let failed = 0;
for (const path of paths) {
  const url = base + path;
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'user-agent': 'MLAMH-Production-Smoke/1.0', accept: 'text/html' },
      cache: 'no-store',
    });
    const html = await response.text();
    const failureText = /Could not query the database for the schema cache|Timed out acquiring connection from connection pool|حدث خطأ غير متوقع|Project paused/i;
    const badBody = failureText.test(html);
    const ok = response.ok && !badBody && html.length > 500;
    console.log(JSON.stringify({ path, status: response.status, ok, bytes: html.length, failureText: badBody }));
    if (!ok) failed++;
  } catch (error) {
    failed++;
    console.error(JSON.stringify({ path, ok: false, error: String(error) }));
  }
}
if (failed) {
  console.error(`Smoke check failed: ${failed}/${paths.length} routes`);
  process.exitCode = 1;
} else {
  console.log(`Smoke check passed: ${paths.length} routes`);
}
