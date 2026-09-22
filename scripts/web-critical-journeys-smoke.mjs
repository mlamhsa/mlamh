import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const arg = process.argv.find((value) => value.startsWith("--base-url="));
const baseUrl = (arg ? arg.split("=", 2)[1] : process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const port = Number(process.env.SMOKE_JOURNEYS_DEBUG_PORT || 9340);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function checkPage(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`, { redirect: "follow" });
  assert(response.ok, `${pathname} returned ${response.status}`);
  assert(response.url.startsWith(baseUrl), `${pathname} unexpectedly left MLAMH origin: ${response.url}`);
  const body = await response.text();
  assert(body.includes("MLAMH") || body.includes("ملامح"), `${pathname} did not render MLAMH content`);
}

async function checkUnauthenticatedOpportunityGuard() {
  const response = await fetch(`${baseUrl}/api/create-opportunity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
    redirect: "manual",
  });
  assert(response.status === 401, `create-opportunity unauthenticated guard expected 401, got ${response.status}`);
  const payload = await response.json();
  assert(payload?.error === "Unauthenticated", "create-opportunity unauthenticated guard returned unexpected payload");
}

function chromeBinary() {
  const candidates = [
    process.env.CHROME_BIN,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Opera.app/Contents/MacOS/Opera",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate));
}

const chrome = chromeBinary();
if (!chrome) throw new Error("Chrome/Chromium binary was not found");

const profile = fs.mkdtempSync(path.join(os.tmpdir(), "mlamh-web-journeys-"));
const browser = spawn(chrome, [
  "--headless=new",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  "--no-first-run",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--no-sandbox",
  `${baseUrl}/ar/login`,
], { stdio: "ignore" });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForTarget() {
  let lastError;
  for (let i = 0; i < 80; i += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json`);
      if (response.ok) {
        const targets = await response.json();
        const page = targets.find((item) => item.type === "page");
        if (page) return page;
      }
    } catch (error) {
      lastError = error;
    }
    await sleep(125);
  }
  throw lastError || new Error("Timed out waiting for browser");
}

async function connect(target) {
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const task = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) task.reject(new Error(JSON.stringify(message.error)));
    else task.resolve(message.result);
  };

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const commandId = ++id;
      pending.set(commandId, { resolve, reject });
      ws.send(JSON.stringify({ id: commandId, method, params }));
      setTimeout(() => {
        if (!pending.has(commandId)) return;
        pending.delete(commandId);
        reject(new Error(`Timed out: ${method}`));
      }, 6000);
    });

  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Browser evaluation failed");
    return result.result.value;
  };

  return { ws, send, evaluate };
}

async function waitFor(evaluate, expression, message) {
  for (let i = 0; i < 60; i += 1) {
    if (await evaluate(expression)) return;
    await sleep(150);
  }
  throw new Error(message);
}

async function navigate(send, evaluate, pathname) {
  await send("Page.navigate", { url: `${baseUrl}${pathname}` });
  await waitFor(evaluate, "document.readyState === 'complete'", `Timed out loading ${pathname}`);
  await sleep(250);
}

let client;
try {
  const isLocalBuild = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(baseUrl);
  const alwaysSafePages = [
    "/ar/login",
    "/ar/join",
    "/ar/join?type=talent",
    "/ar/join?type=publisher",
  ];
  const productionDataPages = [
    "/ar",
    "/ar/talent",
    "/ar/opportunities",
  ];

  await Promise.all(alwaysSafePages.map(checkPage));
  if (!isLocalBuild) {
    await Promise.all(productionDataPages.map(checkPage));
  }
  await checkUnauthenticatedOpportunityGuard();

  const target = await waitForTarget();
  client = await connect(target);
  const { ws, send, evaluate } = client;
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1200, height: 900, deviceScaleFactor: 1, mobile: false });

  await waitFor(evaluate, "!!document.querySelector('input[type=email]') && !!document.querySelector('input[autocomplete=current-password]')", "Login form controls did not render");

  const loginState = JSON.parse(await evaluate(`JSON.stringify({
    email: !!document.querySelector('input[type=email]'),
    password: document.querySelector('input[autocomplete=current-password]')?.type,
    google: Array.from(document.querySelectorAll('button')).some((b)=>b.textContent?.includes('Google')),
    apple: Array.from(document.querySelectorAll('button')).some((b)=>b.textContent?.includes('Apple')),
    forgot: Array.from(document.querySelectorAll('a')).some((a)=>a.getAttribute('href')?.includes('/forgot-password')),
    reveal: !!document.querySelector('button[aria-label="إظهار كلمة المرور"]')
  })`));
  assert(loginState.email, "Login email input missing");
  assert(loginState.password === "password", "Login password input is not masked by default");
  assert(loginState.google, "Google login button missing");
  assert(loginState.apple, "Apple login button missing");
  assert(loginState.forgot, "Forgot password link missing");
  assert(loginState.reveal, "Password reveal control missing");

  await evaluate(`document.querySelector('button[aria-label="إظهار كلمة المرور"]')?.click(); true`);
  await sleep(100);
  assert(await evaluate(`document.querySelector('input[autocomplete=current-password]')?.type === "text"`), "Password reveal control did not work");

  await navigate(send, evaluate, "/ar/join");
  await waitFor(evaluate, `Array.from(document.querySelectorAll('a')).some((a)=>a.getAttribute('href')==='/ar/join?type=talent')`, "Talent join choice missing");
  assert(await evaluate(`Array.from(document.querySelectorAll('a')).some((a)=>a.getAttribute('href')==='/ar/join?type=publisher')`), "Publisher join choice missing");

  await navigate(send, evaluate, "/ar/join?type=talent");
  await waitFor(evaluate, `!!document.querySelector('input[type=email]')`, "Talent signup email input missing");
  assert(await evaluate(`Array.from(document.querySelectorAll('button')).some((b)=>b.textContent?.includes('Google'))`), "Talent Google signup button missing");
  assert(await evaluate(`Array.from(document.querySelectorAll('button')).some((b)=>b.textContent?.includes('Apple'))`), "Talent Apple signup button missing");

  await navigate(send, evaluate, "/ar/join?type=publisher");
  await waitFor(evaluate, `!!document.querySelector('input[type=email]')`, "Publisher signup email input missing");
  assert(await evaluate(`Array.from(document.querySelectorAll('button')).some((b)=>b.textContent?.includes('Google'))`), "Publisher Google signup button missing");
  assert(await evaluate(`Array.from(document.querySelectorAll('button')).some((b)=>b.textContent?.includes('Apple'))`), "Publisher Apple signup button missing");

  console.log(`PASS web critical journeys: ${baseUrl}`);
  ws.close();
} finally {
  try { client?.ws?.close(); } catch {}
  browser.kill("SIGTERM");
  await sleep(250);
  try {
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  } catch (error) {
    console.warn("Journey smoke cleanup warning:", error instanceof Error ? error.message : error);
  }
}
