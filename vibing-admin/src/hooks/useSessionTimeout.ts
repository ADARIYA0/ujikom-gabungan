'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UseSessionTimeoutOptions {
  timeout: number; // in milliseconds
  onTimeout: () => void;
  enabled?: boolean;
}

/**
 * Hook untuk mengelola session timeout berdasarkan user activity
 * Logout otomatis jika tidak ada interaksi selama waktu yang ditentukan
 */
export function useSessionTimeout({
  timeout,
  onTimeout,
  enabled = true,
}: UseSessionTimeoutOptions): void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const onTimeoutRef = useRef(onTimeout);

  // Update onTimeout ref when it changes
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  /**
   * Reset timeout timer
   */
  const resetTimeout = useCallback(() => {
    if (!enabled) return;

    // Update last activity time
    lastActivityRef.current = Date.now();

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      
      // Only logout if no activity for the full timeout period
      if (timeSinceLastActivity >= timeout) {
        onTimeoutRef.current();
      }
    }, timeout);
  }, [timeout, enabled]);

  /**
   * Track user activity events
   */
  useEffect(() => {
    if (!enabled) return;

    // List of events to track
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown',
    ];

    // Add event listeners
    const handleActivity = () => {
      resetTimeout();
    };

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Initialize timeout on mount
    resetTimeout();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resetTimeout, enabled]);

  /**
   * Handle visibility change (tab switch)
   * Reset timeout when user comes back to the tab
   */
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // User came back to the tab, reset timeout
        resetTimeout();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [resetTimeout, enabled]);
}

