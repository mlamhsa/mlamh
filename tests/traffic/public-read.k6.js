import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = __ENV.TRAFFIC_BASE_URL || "http://127.0.0.1:3000";
const isProduction = /^https:\/\/(www\.)?mlamh\.net(?:\/|$)/i.test(baseUrl);

if (isProduction && __ENV.K6_ALLOW_PRODUCTION !== "1") {
  throw new Error("Load tests are blocked on production. Use a staging/local target.");
}

export const options = {
  scenarios: {
    public_read: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: [
        { duration: "30s", target: 10 },
        { duration: "1m", target: 25 },
        { duration: "1m", target: 50 },
        { duration: "30s", target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1500", "p(99)<3000"],
  },
};

const routes = [
  "/ar",
  "/ar/opportunities",
  "/api/opportunities?locale=ar&market=SA",
  "/api/mobile/talents?locale=ar",
];

export default function () {
  const path = routes[Math.floor(Math.random() * routes.length)];
  const response = http.get(`${baseUrl}${path}`, {
    tags: { route: path.split("?")[0] },
    timeout: "10s",
  });

  check(response, {
    "status is 2xx/3xx": (r) => r.status >= 200 && r.status < 400,
  });
  sleep(0.5 + Math.random() * 1.5);
}
