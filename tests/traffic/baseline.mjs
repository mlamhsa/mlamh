const baseUrl = process.env.TRAFFIC_BASE_URL || "https://mlamh.net";
const productionHosts = new Set(["mlamh.net", "www.mlamh.net"]);
const target = new URL(baseUrl);

const routes = [
  ["web.home", "/ar"],
  ["web.opportunities", "/ar/opportunities"],
  ["api.opportunities", "/api/opportunities?locale=ar&market=SA"],
  ["api.mobile.talents", "/api/mobile/talents?locale=ar"],
];

if (productionHosts.has(target.hostname) && process.env.ALLOW_PRODUCTION_BASELINE !== "1") {
  console.error("Refusing production baseline. Set ALLOW_PRODUCTION_BASELINE=1 for single-request probes only.");
  process.exit(2);
}

const results = [];
for (const [name, path] of routes) {
  const started = performance.now();
  const response = await fetch(new URL(path, target), { redirect: "follow" });
  const body = await response.arrayBuffer();
  results.push({ name, status: response.status, ms: +(performance.now() - started).toFixed(1), bytes: body.byteLength });
}

console.table(results);
if (results.some((result) => result.status >= 400)) process.exitCode = 1;
