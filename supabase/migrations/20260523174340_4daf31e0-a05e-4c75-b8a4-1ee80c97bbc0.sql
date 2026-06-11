-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow authenticated users to insert audit logs" ON public.audit_logs;

-- Re-create with check
CREATE POLICY "Allow authenticated users to insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
