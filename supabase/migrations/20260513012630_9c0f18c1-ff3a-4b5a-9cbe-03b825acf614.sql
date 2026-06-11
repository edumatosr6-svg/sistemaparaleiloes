-- Corrigir a função de auditoria para não quebrar inserções/atualizações
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_action TEXT;
BEGIN
    v_user_id := auth.uid();
    
    -- Se não houver usuário autenticado (como no momento do signup), ignorar auditoria para evitar erros
    -- ou usar o ID do novo registro se estivermos criando um perfil
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
