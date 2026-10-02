-- PostgreSQL grants EXECUTE on new functions to PUBLIC by default. The
-- SECURITY DEFINER counter is intended for signed-in Civora users only.
revoke execute on function public.increment_resource_download(uuid) from public, anon;
grant execute on function public.increment_resource_download(uuid) to authenticated;

-- This function is invoked by the ensure_rls DDL event trigger, not the app.
-- The trigger still executes as the function owner after these API grants are revoked.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
