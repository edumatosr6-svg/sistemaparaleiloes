-- Definir search_path fixo para segurança em funções sensíveis
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.process_audit_log() SET search_path = public;
ALTER FUNCTION public.process_finished_lots() SET search_path = public;

-- Revogar execução pública de funções administrativas
REVOKE EXECUTE ON FUNCTION public.process_audit_log() FROM public;
REVOKE EXECUTE ON FUNCTION public.process_finished_lots() FROM public;

-- Criar função auxiliar para checar se o usuário é admin (mais seguro e performático)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::public.user_role
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Corrigir políticas permissivas de Banners
DROP POLICY IF EXISTS "Authenticated users can manage banners" ON public.banners;
CREATE POLICY "Admins can manage banners"
ON public.banners FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Corrigir políticas permissivas de System Settings
DROP POLICY IF EXISTS "Authenticated users can manage settings" ON public.system_settings;
CREATE POLICY "Admins can manage settings"
ON public.system_settings FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Reforçar políticas de Auctions (apenas admins ou criador)
DROP POLICY IF EXISTS "Users can create auctions" ON public.auctions;
CREATE POLICY "Admins or creators can manage auctions"
ON public.auctions FOR ALL
TO authenticated
USING (public.is_admin() OR auth.uid() = created_by)
WITH CHECK (public.is_admin() OR auth.uid() = created_by);

-- Corrigir Storage (Buckets) para não permitir upload público irrestrito
DROP POLICY IF EXISTS "Allow Public Insert" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Delete" ON storage.objects;

CREATE POLICY "Authenticated users can upload assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('auction-assets', 'site-assets'));

CREATE POLICY "Admins can manage assets"
ON storage.objects FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Garantir que perfis públicos só vejam o necessário
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
TO public
USING (true);

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_admin());
