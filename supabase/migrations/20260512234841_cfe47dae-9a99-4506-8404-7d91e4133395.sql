-- Move handle_new_user back to public or create a wrapper
-- It's safer to move it back as the trigger is likely hardcoded to public.handle_new_user
ALTER FUNCTION internal.handle_new_user() SET SCHEMA public;

-- Ensure it has EXECUTE permissions for service_role (which auth triggers use)
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
