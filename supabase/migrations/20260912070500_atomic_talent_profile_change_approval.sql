create or replace function public.approve_talent_profile_change_request(
  p_request_id bigint,
  p_reviewer_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request public.talent_profile_change_requests%rowtype;
begin
  select *
  into v_request
  from public.talent_profile_change_requests
  where id = p_request_id
  for update;

  if not found or v_request.status <> 'pending' then
    return false;
  end if;

  if p_reviewer_user_id is null then
    raise exception using
      errcode = '22023',
      message = 'Reviewer user id is required.';
  end if;

  update public.talents
  set
    name_ar = case
      when v_request.requested_name_ar is null then name_ar
      else v_request.requested_name_ar
    end,
    display_name_ar = case
      when v_request.requested_name_ar is null then display_name_ar
      else (regexp_split_to_array(btrim(v_request.requested_name_ar), E'\\s+'))[1]
    end,
    name_en = case
      when v_request.requested_name_en is null then name_en
      else v_request.requested_name_en
    end,
    display_name_en = case
      when v_request.requested_name_en is null then display_name_en
      else (regexp_split_to_array(btrim(v_request.requested_name_en), E'\\s+'))[1]
    end,
    nationality_slug = case
      when v_request.requested_nationality_slug is null then nationality_slug
      else v_request.requested_nationality_slug
    end,
    nationality = case
      when v_request.requested_nationality_slug is null then nationality
      else v_request.requested_nationality_slug
    end
  where id = v_request.talent_id
    and user_id = v_request.user_id;

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'Talent linked to profile change request was not found.';
  end if;

  if v_request.requested_phone is not null then
    update public.profiles
    set phone = v_request.requested_phone
    where user_id = v_request.user_id
      and account_type = 'talent';

    if not found then
      raise exception using
        errcode = 'P0001',
        message = 'Talent account linked to profile change request was not found.';
    end if;
  end if;

  update public.talent_profile_change_requests
  set
    status = 'approved',
    reviewed_at = now(),
    reviewed_by = p_reviewer_user_id
  where id = v_request.id
    and status = 'pending';

  if not found then
    raise exception using
      errcode = '40001',
      message = 'Profile change request changed while it was being approved.';
  end if;

  return true;
end;
$$;

revoke all on function public.approve_talent_profile_change_request(bigint, uuid) from public;
revoke all on function public.approve_talent_profile_change_request(bigint, uuid) from anon;
revoke all on function public.approve_talent_profile_change_request(bigint, uuid) from authenticated;
grant execute on function public.approve_talent_profile_change_request(bigint, uuid) to service_role;
