-- MLAMH Marketing Hub — operational hardening and essential operating rules

alter table public.marketing_tasks
  add column if not exists idempotency_key text,
  add column if not exists max_retries integer not null default 3 check (max_retries >= 0 and max_retries <= 20),
  add column if not exists locked_at timestamptz,
  add column if not exists locked_by text;

create unique index if not exists marketing_tasks_idempotency_key_idx
  on public.marketing_tasks(idempotency_key)
  where idempotency_key is not null;

create table if not exists public.marketing_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  description text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.marketing_settings enable row level security;

insert into public.marketing_settings(key, value, description)
values
  ('current_sprint', '{"key":"sprint_001","days":7,"talent_registrations":100,"complete_profiles":70,"approved_talents":40,"applications":100,"qualified_demand_leads_min":70,"qualified_demand_leads_max":140,"publisher_conversations":10,"real_briefs":3}'::jsonb, 'Current MLAMH growth sprint targets'),
  ('external_execution_enabled', '{"enabled":false}'::jsonb, 'Global emergency gate for external Marketing Hub execution')
on conflict (key) do nothing;

insert into public.marketing_playbooks(key, title, category, content, status)
values
  ('brand_voice', 'MLAMH Brand Voice', 'brand', '{"default_ar":"ملامح سعودية في النبرة، احترافية في الصورة، بسيطة في الكلام، وليست متصنعة أو شعبوية.","talent_social":"Saudi-white Arabic حديث وواضح","b2b":"Professional Saudi business Arabic","sensitive":"Neutral clear Arabic","allowed_terms":["كاستينغ","مودل","بريف"],"forbidden":["fake jobs","guaranteed selection","guaranteed income","spam","misleading claims","unsupported superlatives"]}'::jsonb, 'active'),
  ('approval_rules', 'Marketing Approval Rules', 'governance', '{"auto":["research","lead_enrichment","classification","internal_scoring","crm_updates","content_ideas","analysis","reporting","internal_slack_updates","routine_internal_tasks"],"approval_required":["social_publish","first_outreach","important_external_message","new_campaign","mlamh_opportunity_marketing","non_routine_customer_response"],"ceo_only":["prices","discounts","contracts","partnerships","sponsorships","ad_spend","commercial_commitments","legal_privacy_safety","disputes","guarantees"]}'::jsonb, 'active'),
  ('outreach_positioning', 'B2B Outreach Positioning', 'outreach', '{"positioning_ar":"أرسل الـBrief → MLAMH ينظم الاحتياج ويجلب Actor/Model applicants مناسبين.","rules":["targeted_qualified_b2b_only","no_mass_spam","do_not_sell_platform_subscription","no_applicant_count_guarantee","no_shortlist_speed_guarantee"]}'::jsonb, 'active'),
  ('external_identity', 'External AI Identity Rule', 'governance', '{"customer_name":"فريق ملامح","b2b_name":"MLAMH Team | Partnerships & Casting","rule":"Do not present AI operating identities as human employees."}'::jsonb, 'active')
on conflict (key) do nothing;

insert into public.marketing_automation_rules(name, event_name, conditions, actions, delay_seconds, status)
values
  ('Qualified lead needs brief', 'lead_stage_changed', '[{"field":"stage","equals":"qualified"},{"field":"brief_status","equals":"none"}]'::jsonb, '[{"type":"create_task","agent_id":"layan","task_type":"request_brief","title":"Request structured brief","objective":"Request the brief from a qualified B2B lead.","approval_level":"approval_required"}]'::jsonb, 0, 'active'),
  ('Measure published content after 24h', 'content_published', '[]'::jsonb, '[{"type":"create_task","agent_id":"rakan","task_type":"measure_content","title":"Measure published content","objective":"Measure performance 24 hours after publication.","approval_level":"auto"}]'::jsonb, 86400, 'active'),
  ('Activate incomplete talent after 24h', 'registration_completed', '[{"field":"account_type","equals":"talent"}]'::jsonb, '[{"type":"create_task","agent_id":"faisal","task_type":"talent_activation_followup","title":"Review incomplete talent activation","objective":"Check whether the talent profile remains incomplete and prepare a compliant activation follow-up.","approval_level":"approval_required"}]'::jsonb, 86400, 'active')
on conflict do nothing;
