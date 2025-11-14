'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UseSessionTimeoutOptions {
    timeoutDuration?: number; // in milliseconds
    warningDuration?: number; // in milliseconds before timeout to show warning
    onTimeout?: () => void;
    onWarning?: () => void;
    isLoggedIn?: boolean;
}

export function useSessionTimeout(options: UseSessionTimeoutOptions = {}) {
    const {
        timeoutDuration = 5 * 60 * 1000, // 5 minutes default
        warningDuration = 1 * 60 * 1000, // 1 minute warning default
        onTimeout,
        onWarning,
        isLoggedIn = false
    } = options;
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const warningRef = useRef<NodeJS.Timeout | null>(null);
    const lastActivityRef = useRef<number>(Date.now());
    const isActiveRef = useRef<boolean>(true);

    const clearTimers = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (warningRef.current) {
            clearTimeout(warningRef.current);
            warningRef.current = null;
        }
    }, []);

    const handleTimeout = useCallback(() => {
        if (isLoggedIn && onTimeout) {
            onTimeout();
        }
    }, [isLoggedIn, onTimeout]);

    const handleWarning = useCallback(() => {
        if (isLoggedIn && onWarning) {
            onWarning();
        }
    }, [isLoggedIn, onWarning]);

    const resetTimer = useCallback(() => {
        if (!isLoggedIn) return;

        clearTimers();
        lastActivityRef.current = Date.now();

        // Set warning timer
        warningRef.current = setTimeout(() => {
            handleWarning();
        }, timeoutDuration - warningDuration);

        // Set timeout timer
        timeoutRef.current = setTimeout(() => {
            handleTimeout();
        }, timeoutDuration);
    }, [isLoggedIn, timeoutDuration, warningDuration, clearTimers, handleTimeout, handleWarning]);

    const handleActivity = useCallback(() => {
        if (!isLoggedIn) return;
        
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivityRef.current;
        
        // Only reset timer if enough time has passed to avoid excessive resets
        if (timeSinceLastActivity > 1000) { // 1 second throttle
            resetTimer();
        }
    }, [isLoggedIn, resetTimer]);

    // Activity event listeners
    useEffect(() => {
        if (!isLoggedIn) {
            clearTimers();
            return;
        }

        const events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
            'click',
            'keydown'
        ];

        // Add event listeners with passive option for better performance
        events.forEach(event => {
            document.addEventListener(event, handleActivity, { passive: true });
        });

        // Start the timer
        resetTimer();

        return () => {
            // Remove event listeners
            events.forEach(event => {
                document.removeEventListener(event, handleActivity);
            });
            clearTimers();
        };
    }, [isLoggedIn, handleActivity, resetTimer, clearTimers]);

    // Handle page visibility change
    useEffect(() => {
        if (!isLoggedIn) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                isActiveRef.current = false;
            } else {
                isActiveRef.current = true;
                // Reset timer when user comes back to the page
                resetTimer();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isLoggedIn, resetTimer]);

    // Handle window focus/blur
    useEffect(() => {
        if (!isLoggedIn) return;

        const handleFocus = () => {
            isActiveRef.current = true;
            resetTimer();
        };

        const handleBlur = () => {
            isActiveRef.current = false;
        };

        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);

        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
        };
    }, [isLoggedIn, resetTimer]);

    return {
        resetTimer,
        clearTimers,
        getRemainingTime: () => {
            if (!isLoggedIn) return 0;
            const elapsed = Date.now() - lastActivityRef.current;
            return Math.max(0, timeoutDuration - elapsed);
        },
        isActive: isActiveRef.current
    };
}
