-- 1. Add UPDATE policy for caucao so users can upload proof_url
-- We allow the update, but a trigger will prevent status changes.
CREATE POLICY "Users can update their own caucao requests"
ON public.caucao
FOR UPDATE
USING (auth.uid() = user_id);

-- 2. Trigger to prevent users from changing caucao status
CREATE OR REPLACE FUNCTION public.protect_caucao_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If NOT admin, prevent status changes
  IF NOT public.is_admin() THEN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
      RAISE EXCEPTION 'Apenas administradores podem alterar o status de uma caução.';
    END IF;
    
    -- Also prevent changing amounts or user_id
    IF (OLD.amount IS DISTINCT FROM NEW.amount) OR (OLD.user_id IS DISTINCT FROM NEW.user_id) THEN
      RAISE EXCEPTION 'Não é permitido alterar o valor ou o usuário de uma caução já criada.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_protect_caucao_status ON public.caucao;
CREATE TRIGGER tr_protect_caucao_status
BEFORE UPDATE ON public.caucao
FOR EACH ROW
EXECUTE FUNCTION public.protect_caucao_status();

-- 3. Create RPC for atomic caucao approval
CREATE OR REPLACE FUNCTION public.approve_caucao(p_caucao_id UUID)
RETURNS void AS $$
DECLARE
    v_caucao RECORD;
BEGIN
    -- Authorization check
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso negado. Apenas administradores podem aprovar cauções.';
    END IF;

    -- Get and lock caucao record
    SELECT * INTO v_caucao FROM public.caucao WHERE id = p_caucao_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Caução não encontrada.';
    END IF;
    
    IF v_caucao.status = 'approved' THEN
        RETURN; -- Already approved
    END IF;

    -- Update caucao status
    UPDATE public.caucao 
    SET status = 'approved', 
        confirmed_at = now(),
        updated_at = now()
    WHERE id = p_caucao_id;

    -- Atomically update user balance
    UPDATE public.profiles_private
    SET caucao_balance = COALESCE(caucao_balance, 0) + v_caucao.amount,
        updated_at = now()
    WHERE id = v_caucao.user_id;

    -- Audit log
    INSERT INTO public.system_logs (level, message, context)
    VALUES ('info', 'Caução aprovada atomicamente', jsonb_build_object('caucao_id', p_caucao_id, 'user_id', v_caucao.user_id, 'amount', v_caucao.amount));

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Create RPC for atomic refund
CREATE OR REPLACE FUNCTION public.refund_caucao_v2(p_caucao_id UUID)
RETURNS void AS $$
DECLARE
    v_caucao RECORD;
    v_current_balance NUMERIC;
BEGIN
    -- Authorization check
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso negado. Apenas administradores podem reembolsar cauções.';
    END IF;

    -- Get and lock caucao record
    SELECT * INTO v_caucao FROM public.caucao WHERE id = p_caucao_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Caução não encontrada.';
    END IF;
    
    IF v_caucao.status != 'approved' THEN
        RAISE EXCEPTION 'Apenas cauções aprovadas podem ser reembolsadas.';
    END IF;

    -- Check if user has enough balance
    SELECT caucao_balance INTO v_current_balance FROM public.profiles_private WHERE id = v_caucao.user_id FOR UPDATE;
    
    IF v_current_balance < v_caucao.amount THEN
        RAISE EXCEPTION 'Saldo insuficiente para realizar o reembolso integral.';
    END IF;

    -- Update caucao status
    UPDATE public.caucao 
    SET status = 'refunded', 
        is_refunded = true,
        updated_at = now()
    WHERE id = p_caucao_id;

    -- Deduct from balance
    UPDATE public.profiles_private
    SET caucao_balance = caucao_balance - v_caucao.amount,
        updated_at = now()
    WHERE id = v_caucao.user_id;

    -- Audit log
    INSERT INTO public.system_logs (level, message, context)
    VALUES ('info', 'Caução reembolsada atomicamente', jsonb_build_object('caucao_id', p_caucao_id, 'user_id', v_caucao.user_id, 'amount', v_caucao.amount));

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Secure RPC execute permissions
REVOKE EXECUTE ON FUNCTION public.approve_caucao(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refund_caucao_v2(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_caucao(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_caucao_v2(UUID) TO authenticated;

-- 6. Atomic winner payment confirmation
CREATE OR REPLACE FUNCTION public.confirm_winner_payment(p_winner_id UUID)
RETURNS void AS $$
DECLARE
    v_winner RECORD;
BEGIN
    -- Authorization check
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso negado. Apenas administradores podem confirmar pagamentos.';
    END IF;

    SELECT * INTO v_winner FROM public.auction_winners WHERE id = p_winner_id FOR UPDATE;
    
    IF NOT FOUND THEN RAISE EXCEPTION 'Arremate não encontrado.'; END IF;

    UPDATE public.auction_winners 
    SET escrow_status = 'paid', 
        updated_at = now()
    WHERE id = p_winner_id;

    -- Notification
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
        v_winner.user_id, 
        '✅ Pagamento Confirmado!', 
        'Seu pagamento foi validado. O recibo está disponível no seu painel.', 
        'payment_success'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.confirm_winner_payment(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_winner_payment(UUID) TO authenticated;
