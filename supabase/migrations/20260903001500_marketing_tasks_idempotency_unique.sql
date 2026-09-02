-- The autonomous marketing orchestrator uses idempotency_key as its
-- ON CONFLICT target. PostgreSQL requires a matching unique constraint/index.
-- UNIQUE indexes allow multiple NULL values, preserving legacy/manual tasks.
create unique index if not exists marketing_tasks_idempotency_key_uidx
  on public.marketing_tasks (idempotency_key);
