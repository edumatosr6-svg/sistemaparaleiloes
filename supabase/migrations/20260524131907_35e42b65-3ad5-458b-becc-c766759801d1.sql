-- 1. Add admin policies for notifications
CREATE POLICY "Admins can view all notifications"
ON public.notifications
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update all notifications"
ON public.notifications
FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete all notifications"
ON public.notifications
FOR DELETE
USING (public.is_admin());

-- 2. Ensure system_logs has admin-only select
-- (Check existing first, but good practice to have it)
DROP POLICY IF EXISTS "Admins can view system logs" ON public.system_logs;
CREATE POLICY "Admins can view system logs"
ON public.system_logs
FOR SELECT
USING (public.is_admin());

-- 3. Revoke public access to internal system logs
REVOKE ALL ON public.system_logs FROM anon, authenticated;
GRANT SELECT ON public.system_logs TO authenticated; -- Only authenticated (checked by RLS)
GRANT ALL ON public.system_logs TO service_role;
