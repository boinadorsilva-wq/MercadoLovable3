import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type SubscriptionStatus = 'active' | 'expired' | 'none' | 'loading';

interface SubscriptionState {
    status: SubscriptionStatus;
    daysRemaining: number | null;
    expiresAt: string | null;
    planType: string | null;
    isLoading: boolean;
}

export function useSubscription() {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState<SubscriptionState>({
        status: 'loading',
        daysRemaining: null,
        expiresAt: null,
        planType: null,
        isLoading: true
    });

    useEffect(() => {
        if (!user) {
            setSubscription(prev => ({ ...prev, status: 'none', isLoading: false }));
            return;
        }

        const fetchSubscription = async () => {
            try {
                const { data, error } = await supabase
                    .from('user_subscriptions' as any)
                    .select('*')
                    .eq('user_id', user.id)
                    .order('expires_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (error) throw error;

                if (!data) {
                    setSubscription({
                        status: 'none',
                        daysRemaining: null,
                        expiresAt: null,
                        planType: null,
                        isLoading: false
                    });
                    return;
                }

                const subscriptionData = data as any;
                const expiresAt = new Date(subscriptionData.expires_at);
                const now = new Date();

                // Calculate difference in milliseconds
                const diffTime = expiresAt.getTime() - now.getTime();

                // Calculate days remaining (ceil to show "1 day" even if it expires in 1 hour)
                const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

                // Valid if expiration date is in the future
                const isValid = expiresAt > now;
                const customStatus = subscriptionData.status === 'active' && isValid ? 'active' : 'expired';

                setSubscription({
                    status: customStatus,
                    daysRemaining,
                    expiresAt: subscriptionData.expires_at,
                    planType: subscriptionData.plan_type,
                    isLoading: false
                });

            } catch (error) {
                console.error('Error fetching subscription:', error);
                setSubscription(prev => ({ ...prev, status: 'none', isLoading: false }));
            }
        };

        fetchSubscription();
    }, [user]);

    return subscription;
}
