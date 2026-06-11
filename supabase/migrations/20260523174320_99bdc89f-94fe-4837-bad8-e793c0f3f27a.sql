-- Enable RLS on audit_logs if not already enabled
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Add policy to allow INSERT for authenticated users
-- This is necessary because the process_audit_log trigger runs on multiple tables
-- and needs to insert into audit_logs.
CREATE POLICY "Allow authenticated users to insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Ensure admins can still see all logs
-- (Updating existing policy to be more explicit if needed, but let's just keep it)
-- The existing policy "Admins can view audit logs" is already there.
