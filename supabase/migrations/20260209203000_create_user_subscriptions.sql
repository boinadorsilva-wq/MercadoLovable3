-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'expired', 'canceled'
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT user_subscriptions_user_id_key UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Policy to allow users to view their own subscription
CREATE POLICY "Users can view their own subscription" 
ON public.user_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy to allow service role (webhook) to insert/update
-- (Service role bypasses RLS, but explicit policies can help if using a scoped client)
-- Generally not needed for service_role, but good for completeness if we ever use a restrictive role.

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
