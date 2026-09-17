import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = __ENV.TRAFFIC_BASE_URL || "http://127.0.0.1:3000";
const isProduction = /^https:\/\/(www\.)?mlamh\.net(?:\/|$)/i.test(baseUrl);
const maxVUs = Number(__ENV.MAX_VUS || 250);

if (isProduction && __ENV.K6_ALLOW_PRODUCTION !== "1") {
  throw new Error("Capacity/stress tests are blocked on production by default.");
}

export const options = {
  stages: [
    { duration: "1m", target: Math.max(10, Math.round(maxVUs * 0.2)) },
    { duration: "2m", target: Math.max(25, Math.round(maxVUs * 0.4)) },
    { duration: "2m", target: Math.max(50, Math.round(maxVUs * 0.6)) },
    { duration: "2m", target: Math.max(100, Math.round(maxVUs * 0.8)) },
    { duration: "2m", target: maxVUs },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<2000", "p(99)<4000"],
  },
};

const apiRoutes = [
  "/api/opportunities?locale=ar&market=SA",
  "/api/mobile/talents?locale=ar",
];

export default function () {
  const path = apiRoutes[Math.floor(Math.random() * apiRoutes.length)];
  const response = http.get(`${baseUrl}${path}`, {
    tags: { route: path.split("?")[0] },
    timeout: "10s",
  });
  check(response, {
    "status is 2xx": (r) => r.status >= 200 && r.status < 300,
  });
  sleep(Math.random());
}
