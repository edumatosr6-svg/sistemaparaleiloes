-- Ensure pgcrypto is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to create a user and its profile safely
CREATE OR REPLACE FUNCTION seed_user(
    email TEXT,
    password TEXT,
    full_name TEXT,
    cpf_cnpj TEXT,
    phone TEXT,
    balance NUMERIC
) RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Check if user exists
    SELECT id INTO new_user_id FROM auth.users WHERE auth.users.email = seed_user.email;
    
    IF new_user_id IS NULL THEN
        -- Create user in auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            email,
            crypt(password, gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider":"email","providers":["email"]}',
            jsonb_build_object('full_name', full_name),
            now(),
            now(),
            '',
            '',
            '',
            ''
        ) RETURNING id INTO new_user_id;

        -- Profile is usually created by a trigger, but let's ensure it has the right data
        -- If the trigger exists, we update it. If not, we insert it.
        -- We'll try to update first, and if nothing was updated, we insert.
        UPDATE public.profiles SET
            full_name = seed_user.full_name,
            cpf_cnpj = seed_user.cpf_cnpj,
            phone = seed_user.phone,
            caucao_balance = seed_user.balance,
            is_approved = true
        WHERE id = new_user_id;
        
        IF NOT FOUND THEN
            INSERT INTO public.profiles (id, full_name, cpf_cnpj, phone, caucao_balance, is_approved)
            VALUES (new_user_id, full_name, cpf_cnpj, phone, balance, true);
        END IF;
    END IF;
    
    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed 4 users
SELECT seed_user('joao.silva@example.com', '123456', 'João Silva', '123.456.789-01', '(11) 98888-7777', 15000.00);
SELECT seed_user('maria.oliveira@example.com', '123456', 'Maria Oliveira', '987.654.321-02', '(21) 97777-6666', 25000.00);
SELECT seed_user('ricardo.santos@example.com', '123456', 'Ricardo Santos', '456.789.123-03', '(31) 96666-5555', 5000.00);
SELECT seed_user('ana.costa@example.com', '123456', 'Ana Costa', '321.654.987-04', '(19) 95555-4444', 10000.00);

-- Clean up the temporary function
DROP FUNCTION seed_user;
