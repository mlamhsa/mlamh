# MLAMH Traffic & Scalability Tests

This suite measures public web and read-only API scalability without modifying user data.

## Safety policy

- Load, capacity, stress, and spike tests target local/staging/preview environments only by default.
- `mlamh.net` and `www.mlamh.net` are blocked in k6 tests unless `K6_ALLOW_PRODUCTION=1` is explicitly supplied.
- Production baseline probes are single-request checks only and require `ALLOW_PRODUCTION_BASELINE=1`.
- Authenticated writes, payments, applications, messaging, account mutations, and mobile-native release work are excluded.

## Baseline

```bash
TRAFFIC_BASE_URL=https://preview.example.com npm run traffic:baseline
```

Captured fields: HTTP status, end-to-end latency, and response bytes.

## Public-read load

```bash
TRAFFIC_BASE_URL=https://preview.example.com npm run traffic:load
```

Default profile ramps 1 → 10 → 25 → 50 VUs and checks p95, p99, and HTTP error rate.

## Capacity ladder

```bash
TRAFFIC_BASE_URL=https://preview.example.com MAX_VUS=250 npm run traffic:capacity
```

Recommended ladder after a healthy 250-VU run: 500, then 1,000 VUs. Stop when latency/error thresholds fail; that point becomes the current observed capacity boundary.

## Coverage

The suite is intentionally limited to current public Web/read-only surfaces:

- `/ar`
- `/ar/opportunities`
- `/ar/talent`
- `/api/opportunities?locale=ar&market=SA`

It does not modify `apps/mobile` or the active Native V3 release branch.

## Initial acceptance targets

- HTTP failure rate: < 1% for normal load.
- p95 response time: < 1.5 s for normal public-read traffic.
- p99 response time: < 3 s for normal public-read traffic.
- Capacity threshold: < 2% failures, p95 < 2 s, p99 < 4 s.
- No 5xx burst or sustained serverless timeout during the test.
