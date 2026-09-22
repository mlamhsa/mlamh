import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const arg = process.argv.find((value) => value.startsWith("--base-url="));
const baseUrl = (arg ? arg.split("=", 2)[1] : process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const pageUrl = `${baseUrl}/ar/join?type=talent`;
const port = Number(process.env.SMOKE_DEBUG_PORT || 9339);

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

const profile = fs.mkdtempSync(path.join(os.tmpdir(), "mlamh-web-smoke-"));
const browser = spawn(
  chrome,
  [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--no-sandbox",
    pageUrl,
  ],
  { stdio: "ignore" },
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForTargets() {
  let lastError;
  for (let i = 0; i < 80; i += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json`);
      if (response.ok) return await response.json();
    } catch (error) {
      lastError = error;
    }
    await sleep(125);
  }
  throw lastError || new Error("Timed out waiting for browser debugging endpoint");
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
      }, 5000);
    });

  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text || "Browser evaluation failed");
    }
    return result.result.value;
  };

  return { ws, send, evaluate };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function clickVisible(evaluate, selector) {
  await evaluate(`document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({block:"center"}); true`);
  await sleep(80);
  const state = JSON.parse(await evaluate(`JSON.stringify((()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)return null;const r=e.getBoundingClientRect();const x=r.left+r.width/2;const y=r.top+r.height/2;const hit=document.elementFromPoint(x,y);return{width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom,hitMatches:hit===e||e.contains(hit)}})())`));
  assert(state && state.width > 20 && state.height > 20, `${selector} is not visibly clickable`);
  assert(state.hitMatches, `${selector} is covered by another element`);
  const clicked = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)return false;e.click();return true})()`);
  assert(clicked, `${selector} could not be clicked`);
  await sleep(120);
  return state;
}

async function testPicker(send, evaluate, triggerId, expectedOptions) {
  const selector = `#${triggerId}`;
  await clickVisible(evaluate, selector);
  const stateRaw = await evaluate(`JSON.stringify((()=>{const t=document.querySelector(${JSON.stringify(selector)});const boxes=Array.from(document.querySelectorAll('[role="listbox"]')).filter(e=>{const s=getComputedStyle(e);const r=e.getBoundingClientRect();return s.display!=="none"&&s.visibility!=="hidden"&&r.width>0&&r.height>0});return{expanded:t?.getAttribute("aria-expanded"),boxes:boxes.map(e=>{const r=e.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,options:Array.from(e.querySelectorAll('[role="option"]')).map(o=>o.textContent?.trim())}})}})())`);
  const state = JSON.parse(stateRaw);

  assert(state.expanded === "true", `${triggerId} did not open`);
  assert(state.boxes.length === 1, `${triggerId} did not render exactly one visible desktop listbox`);

  const box = state.boxes[0];
  assert(box.options.length === expectedOptions.length, `${triggerId} expected ${expectedOptions.length} options, found ${box.options.length}`);
  for (const option of expectedOptions) {
    assert(box.options.includes(option), `${triggerId} is missing option: ${option}`);
  }

  const attachedToField = await evaluate(`(()=>{const t=document.querySelector(${JSON.stringify(selector)});const b=Array.from(document.querySelectorAll('[role="listbox"]')).find(e=>{const s=getComputedStyle(e);const r=e.getBoundingClientRect();return s.display!=="none"&&s.visibility!=="hidden"&&r.width>0&&r.height>0});return !!(t&&b&&t.parentElement?.contains(b))})()`);
  assert(attachedToField, `${triggerId} listbox escaped its field container (desktop portal regression)`);

  const optionSelector = `[role="listbox"] [role="option"]`;
  await clickVisible(evaluate, optionSelector);
  const selected = await evaluate(`document.querySelector(${JSON.stringify(selector)})?.textContent?.trim()`);
  const expandedAfter = await evaluate(`document.querySelector(${JSON.stringify(selector)})?.getAttribute("aria-expanded")`);
  assert(expectedOptions.includes(selected), `${triggerId} did not persist a selected value`);
  assert(expandedAfter === "false", `${triggerId} did not close after selection`);
}

let client;
try {
  const targets = await waitForTargets();
  const target = targets.find((item) => item.type === "page" && item.url.includes("/ar/join"));
  assert(target, "Join page target was not created");

  client = await connect(target);
  const { send, evaluate } = client;

  await send("Runtime.enable");
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1200,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  for (let i = 0; i < 60; i += 1) {
    const ready = await evaluate("document.readyState");
    const hasTrigger = await evaluate("!!document.getElementById('signup-gender-trigger')");
    if (ready === "complete" && hasTrigger) break;
    await sleep(150);
  }
  await sleep(400);

  const title = await evaluate("document.title");
  assert(title.includes("MLAMH"), "Join page did not load the MLAMH application");

  await testPicker(send, evaluate, "signup-gender-trigger", ["ذكر", "أنثى"]);
  await testPicker(send, evaluate, "signup-talent-type-trigger", ["ممثل / ممثلة", "مودل"]);

  console.log(`PASS web critical smoke: ${pageUrl}`);
} finally {
  try { client?.ws?.close(); } catch {}
  browser.kill("SIGTERM");
  await sleep(250);
  try {
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  } catch (error) {
    console.warn("Smoke cleanup warning:", error instanceof Error ? error.message : error);
  }
}
