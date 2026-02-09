import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

const TRIAL_DURATION_MS = 30 * 1000; // 30 seconds
const STORAGE_KEY_PREFIX = 'trial_start_';

export function useTrial() {
    const { user } = useAuth();
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!user) {
            setTimeLeft(null);
            setIsExpired(false);
            return;
        }

        const storageKey = `${STORAGE_KEY_PREFIX}${user.id}`;
        const storedStart = localStorage.getItem(storageKey);

        let startTime: number;

        if (storedStart) {
            startTime = parseInt(storedStart, 10);
        } else {
            startTime = Date.now();
            localStorage.setItem(storageKey, startTime.toString());
        }

        const updateTimer = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const remaining = Math.max(0, Math.ceil((TRIAL_DURATION_MS - elapsed) / 1000));

            setTimeLeft(remaining);
            setIsExpired(remaining <= 0);
        };

        updateTimer(); // Initial check

        const intervalId = setInterval(updateTimer, 1000);

        return () => clearInterval(intervalId);
    }, [user]);

    return { timeLeft, isExpired };
}
