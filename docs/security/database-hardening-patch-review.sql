-- MLAMH Database Hardening Patch — REVIEW DRAFT ONLY
-- Date: 2026-09-03
-- IMPORTANT:
--   This file is NOT a production migration.
--   Do not execute against production without explicit approval.
--   It exists to review the minimal P0/P1 hardening changes before migration creation.

-- ============================================================
-- P0. SECURITY DEFINER privilege tightening
-- ============================================================

-- Internal maintenance function: no public/client execution required.
revoke execute on function public.expire_featured_talents() from public;
revoke execute on function public.expire_featured_talents() from anon;
revoke execute on function public.expire_featured_talents() from authenticated;
grant execute on function public.expire_featured_talents() to service_role;

-- RLS helper: authenticated execution IS required by messages,
-- message_attachments, and storage.objects policies.
-- Anonymous execution is not required.
revoke execute on function public.is_conversation_participant(bigint) from public;
revoke execute on function public.is_conversation_participant(bigint) from anon;
grant execute on function public.is_conversation_participant(bigint) to authenticated;
grant execute on function public.is_conversation_participant(bigint) to service_role;

-- Public view counter is intentionally NOT changed in this first patch.
-- public.increment_talent_view(bigint) requires a separate product/security
-- decision because its present SECURITY DEFINER contract can be abused to
-- inflate counters, while revoking it blindly could break public talent views.

-- ============================================================
-- P1. Fixed search_path for existing functions
-- ============================================================

alter function public.set_contact_requests_updated_at()
  set search_path = public;

alter function public.set_updated_at()
  set search_path = public;

alter function public.claim_next_marketing_task(text)
  set search_path = public;

alter function public.sync_marketing_agent_from_task()
  set search_path = public;

-- ============================================================
-- P1. Direct RPC surface reduction for trigger-only functions
-- ============================================================

-- These functions are trigger helpers and do not need to be public RPCs.
revoke execute on function public.set_contact_requests_updated_at() from public;
revoke execute on function public.set_contact_requests_updated_at() from anon;
revoke execute on function public.set_contact_requests_updated_at() from authenticated;
grant execute on function public.set_contact_requests_updated_at() to service_role;

revoke execute on function public.set_updated_at() from public;
revoke execute on function public.set_updated_at() from anon;
revoke execute on function public.set_updated_at() from authenticated;
grant execute on function public.set_updated_at() to service_role;

revoke execute on function public.sync_marketing_agent_from_task() from public;
revoke execute on function public.sync_marketing_agent_from_task() from anon;
revoke execute on function public.sync_marketing_agent_from_task() from authenticated;
grant execute on function public.sync_marketing_agent_from_task() to service_role;

-- claim_next_marketing_task(text) is already service-role-only in production.
-- Preserve its existing role boundary while fixing search_path.
revoke execute on function public.claim_next_marketing_task(text) from public;
revoke execute on function public.claim_next_marketing_task(text) from anon;
revoke execute on function public.claim_next_marketing_task(text) from authenticated;
grant execute on function public.claim_next_marketing_task(text) to service_role;

-- ============================================================
-- Explicitly deferred from this first patch
-- ============================================================

-- 1. increment_talent_view(bigint) redesign / throttling / anti-abuse
-- 2. 51 RLS-no-policy tables with legacy client grants
-- 3. RLS init-plan performance rewrites
-- 4. duplicate permissive policy reconciliation
-- 5. missing covering indexes
-- 6. unused-index removal
-- 7. leaked-password protection (Auth dashboard/config, not SQL migration)

-- ============================================================
-- Required verification after any future application
-- ============================================================

-- Re-run Supabase security advisors.
-- Verify authenticated message read + insert.
-- Verify authenticated message attachment read + upload + delete.
-- Verify service-side marketing task claiming.
-- Verify triggers still maintain updated_at and marketing agent state.
-- Verify public talent pages remain functional.
-- Run complete application tests + production build before deployment.
