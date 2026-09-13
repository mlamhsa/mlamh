update public.publishers
set verified = (coalesce(verification_status, 'unverified') = 'verified')
where verified is distinct from (coalesce(verification_status, 'unverified') = 'verified');
