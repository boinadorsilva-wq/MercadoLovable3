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
                    .eq('user_id', user.id);

                if (error) throw error;

                if (!data || data.length === 0) {
                    setSubscription({
                        status: 'none',
                        daysRemaining: null,
                        expiresAt: null,
                        planType: null,
                        isLoading: false
                    });
                    return;
                }

                // Find the first active subscription that hasn't expired
                const now = new Date();
                const activeSubscription = data.find((sub: any) => {
                    const expiresAt = new Date(sub.expires_at);
                    return sub.status === 'active' && expiresAt > now;
                });

                // If no active subscription found, use the most recent one (even if expired) for display purposes
                const mostRecentSubscription = activeSubscription || data.sort((a: any, b: any) =>
                    new Date(b.expires_at).getTime() - new Date(a.expires_at).getTime()
                )[0];

                const subscriptionData = mostRecentSubscription;
                const expiresAt = new Date(subscriptionData.expires_at);

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
