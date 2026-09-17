# MLAMH Traffic & Scalability Tests

This suite measures web and Native API scalability without modifying user data.

## Safety policy

- Load, capacity, stress, and spike tests target local/staging by default.
- `mlamh.net` is blocked in k6 tests unless `K6_ALLOW_PRODUCTION=1` is explicitly supplied.
- Production baseline probes are single-request checks only and require `ALLOW_PRODUCTION_BASELINE=1`.
- Authenticated write flows, payments, applications, messaging, and account mutations are excluded from the first phase.

## Phase 1 — Baseline

```bash
ALLOW_PRODUCTION_BASELINE=1 npm run traffic:baseline
```

Captured fields: HTTP status, end-to-end latency, and response bytes.

## Phase 2 — Public read load

```bash
TRAFFIC_BASE_URL=https://staging.example.com k6 run tests/traffic/public-read.k6.js
```

Default profile ramps 1 → 10 → 25 → 50 VUs and checks p95, p99, and HTTP error rate.

## Phase 3 — Capacity ladder

```bash
TRAFFIC_BASE_URL=https://staging.example.com MAX_VUS=250 k6 run tests/traffic/capacity.k6.js
```

Recommended ladder after the 250-VU run is healthy: 500, then 1,000 VUs. Stop when p95/p99 or error thresholds fail; that point becomes the current capacity boundary.

## Coverage

The first read-only suite represents both Web and Native traffic through:

- `/ar`
- `/ar/opportunities`
- `/api/opportunities?locale=ar&market=SA`
- `/api/mobile/talents?locale=ar`

The Native application also calls authenticated account, conversation, application, publisher workspace, Scene, and Supabase Auth APIs. Those belong in Phase 4 with dedicated test accounts and isolated test data.

## Acceptance targets

- HTTP failure rate: < 1% for normal load.
- p95 response time: < 1.5 s for normal public read traffic.
- p99 response time: < 3 s for normal public read traffic.
- Capacity test threshold: < 2% failures, p95 < 2 s, p99 < 4 s.
- No 5xx burst, DB connection exhaustion, or sustained serverless timeout during the test.
