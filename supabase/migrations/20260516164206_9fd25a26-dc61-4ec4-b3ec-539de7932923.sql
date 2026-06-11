-- Revoke execute from anon explicitly to clear any direct grants
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Also revoke from PUBLIC again just to be sure
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

-- Ensure authenticated and service_role still have access
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres;
