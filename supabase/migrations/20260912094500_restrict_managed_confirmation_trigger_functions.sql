revoke all on function public.enforce_managed_confirmation_application_gate() from public, anon, authenticated;
revoke all on function public.enforce_managed_confirmation_conversation_gate() from public, anon, authenticated;

grant execute on function public.enforce_managed_confirmation_application_gate() to service_role;
grant execute on function public.enforce_managed_confirmation_conversation_gate() to service_role;
