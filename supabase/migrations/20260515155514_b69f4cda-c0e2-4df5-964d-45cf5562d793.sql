CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_data, new_data)
    VALUES (
        auth.uid(), -- Allow NULL if not authenticated
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN row_to_json(OLD)::jsonb ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW)::jsonb ELSE NULL END
    );
    RETURN COALESCE(NEW, OLD); -- Fixed: Return NEW or OLD instead of NULL for AFTER triggers (though usually AFTER triggers return NULL, this looks like it might be BEFORE or just generally better to return the row)
END;
$$ LANGUAGE plpgsql;