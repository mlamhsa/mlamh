insert into public.permissions(key, name, description, group_name)
values
  ('marketing.view', 'View Marketing Hub', 'View Marketing Hub operations and analytics.', 'marketing'),
  ('marketing.manage', 'Manage Marketing Hub', 'Create and update Marketing Hub operational records.', 'marketing'),
  ('marketing.approve', 'Approve Marketing Actions', 'Approve or reject governed marketing actions.', 'marketing'),
  ('marketing.integrations.manage', 'Manage Marketing Integrations', 'Manage Marketing Hub integration configuration state.', 'marketing')
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  group_name = excluded.group_name;

insert into public.role_permissions(role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key like 'marketing.%'
where r.key in ('super_admin','admin')
on conflict do nothing;
