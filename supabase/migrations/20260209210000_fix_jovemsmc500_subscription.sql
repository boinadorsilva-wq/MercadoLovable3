-- Data migration to restore subscription for jovemsmc500@gmail.com
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Try to find the user by email
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'jovemsmc500@gmail.com';
    
    -- If user found, insert subscription
    IF target_user_id IS NOT NULL THEN
        INSERT INTO public.user_subscriptions (
            user_id, 
            plan_type, 
            status, 
            starts_at, 
            expires_at,
            updated_at
        )
        VALUES (
            target_user_id, 
            'recovered_manual', 
            'active', 
            now(), 
            now() + interval '30 days',
            now()
        )
        ON CONFLICT (user_id) DO UPDATE SET
            status = 'active',
            plan_type = 'recovered_manual',
            expires_at = now() + interval '30 days',
            updated_at = now();
    END IF;
END $$;
