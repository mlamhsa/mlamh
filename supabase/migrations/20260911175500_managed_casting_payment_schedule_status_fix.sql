drop trigger if exists trg_sync_managed_casting_payment_schedule on public.casting_projects;
create trigger trg_sync_managed_casting_payment_schedule
after insert or update on public.casting_projects
for each row execute function public.sync_managed_casting_payment_schedule();
