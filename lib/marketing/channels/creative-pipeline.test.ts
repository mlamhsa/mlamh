import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path: string) {
  return readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");
}

test("content strategy creates a creative task before social publishing approval", () => {
  const materialize = source("lib/marketing/tasks/materialize.ts");
  assert.match(materialize, /taskType:\s*"creative_brief"/);
  assert.match(materialize, /task\.task_type === "creative_brief"/);
  assert.match(materialize, /taskType:\s*"social_publish"/);
  assert.match(materialize, /asset_urls:\s*assetReferences/);
  assert.match(materialize, /visual_required:\s*true/);
});

test("social execution keeps the visual gate", () => {
  const executor = source("lib/marketing/channels/executor.ts");
  assert.match(executor, /assertVisualReadiness/);
  assert.match(executor, /visual_required_for_/);
});
