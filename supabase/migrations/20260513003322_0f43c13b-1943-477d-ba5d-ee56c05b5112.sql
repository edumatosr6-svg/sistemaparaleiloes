DO $$
DECLARE
    user_count int;
BEGIN
    SELECT count(*) INTO user_count FROM auth.users;
    RAISE NOTICE 'Found % users in auth.users', user_count;
END $$;

-- Try inserting profiles again with a more direct approach
INSERT INTO public.profiles (id, role)
SELECT id, 'admin' FROM auth.users
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Return the profiles for debugging
SELECT * FROM public.profiles;
