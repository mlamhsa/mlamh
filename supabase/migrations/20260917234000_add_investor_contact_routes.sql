-- Verified public contact routes for Investor Relations AI.
-- Server-only fields; existing RLS/service-role policy remains unchanged.

alter table public.investor_leads
  add column if not exists contact_route_url text,
  add column if not exists contact_route_type text;

alter table public.investor_leads
  drop constraint if exists investor_leads_contact_route_type_check;

alter table public.investor_leads
  add constraint investor_leads_contact_route_type_check
  check (
    contact_route_type is null
    or contact_route_type in ('email', 'application_form', 'contact_form', 'linkedin', 'website')
  );
