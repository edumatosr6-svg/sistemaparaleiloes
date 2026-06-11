-- Corrigir handle_new_user com search_path e referências explícitas
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (
    NEW.id,
    CASE
      WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin'::public.user_role) THEN 'admin'::public.user_role
      ELSE 'user'::public.user_role
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Corrigir process_audit_log com search_path
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_action TEXT;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL AND TG_TABLE_NAME = 'profiles' AND TG_OP = 'INSERT' THEN
        v_user_id := NEW.id;
    END IF;

    IF (TG_OP = 'INSERT') THEN
        v_action := 'INSERT';
        INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, new_data)
        VALUES (v_user_id, v_action, TG_TABLE_NAME, (NEW).id, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_action := 'UPDATE';
        INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_data, new_data)
        VALUES (v_user_id, v_action, TG_TABLE_NAME, (NEW).id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        v_action := 'DELETE';
        INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_data)
        VALUES (v_user_id, v_action, TG_TABLE_NAME, (OLD).id, row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar a função que estava faltando para evitar erros nos triggers de lances
CREATE OR REPLACE FUNCTION public.process_finished_lots()
RETURNS void AS $$
BEGIN
  -- Esta função pode ser expandida futuramente para processar leilões encerrados
  NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
