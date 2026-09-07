import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { getOutreachReadiness } from "./outreach-readiness.ts";

function source(path: string) {
  return readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8");
}

test("outreach readiness requires contact name, professional role and a reachable channel", () => {
  assert.equal(getOutreachReadiness({
    contact_name: "Producer Name",
    email: "producer@example.com",
    metadata: { job_title: "Executive Producer" },
  }).isReady, true);

  const missingRole = getOutreachReadiness({
    contact_name: "Producer Name",
    email: "producer@example.com",
    metadata: {},
  });
  assert.equal(missingRole.isReady, false);
  assert.deepEqual(missingRole.missingFields, ["contact_role"]);

  const missingChannel = getOutreachReadiness({
    contact_name: "Producer Name",
    metadata: { role: "Producer" },
  });
  assert.equal(missingChannel.isReady, false);
  assert.deepEqual(missingChannel.missingFields, ["contact_channel"]);
});

test("orchestrator, AI grounding and materializer consume the shared readiness contract", () => {
  const orchestrator = source("lib/marketing/orchestrator.ts");
  const runner = source("lib/marketing/tasks/runner.ts");
  const materializer = source("lib/marketing/tasks/materialize.ts");

  assert.match(orchestrator, /getOutreachReadiness/);
  assert.match(orchestrator, /if \(!readiness\.isReady\)/);
  assert.match(orchestrator, /taskType: "lead_enrichment"/);
  assert.match(runner, /outreach_ready: readiness\.isReady/);
  assert.match(runner, /missing_fields: readiness\.missingFields/);
  assert.match(materializer, /if \(!readiness\.isReady\) continue/);
});
