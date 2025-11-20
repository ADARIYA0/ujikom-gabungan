/**
 * Token Refresh Hook
 * Automatically refreshes access tokens before expiry
 * Compatible with Next.js 15.5.4 and React 19.1
 */

'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthApiService from '@/services/authService';

/**
 * Custom hook for automatic token refresh
 * Checks token expiry every 2 minutes and refreshes if needed
 */
export function useTokenRefresh() {
    const { refreshToken, logout, isAuthenticated } = useAuth();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isRefreshingRef = useRef(false);

    useEffect(() => {
        // Clear any existing interval first
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (!isAuthenticated) {
            isRefreshingRef.current = false;
            return;
        }

        const checkAndRefreshToken = async () => {
            // Double check authentication status before proceeding
            if (!isAuthenticated) {
                return;
            }

            // Prevent multiple simultaneous refresh attempts
            if (isRefreshingRef.current) {
                return;
            }

            try {
                const accessToken = localStorage.getItem('accessToken');

                // If no token, don't attempt refresh
                if (!accessToken) {
                    return;
                }

                // Check if token is expired or will expire soon (within 5 minutes)
                if (AuthApiService.isTokenExpired(accessToken)) {
                    isRefreshingRef.current = true;
                    await refreshToken();
                } else {
                    // Check if token will expire in next 5 minutes
                    try {
                        const base64Url = accessToken.split('.')[1];
                        if (base64Url) {
                            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                            const jsonPayload = decodeURIComponent(
                                atob(base64)
                                    .split('')
                                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                                    .join('')
                            );

                            const payload = JSON.parse(jsonPayload);
                            const currentTime = Date.now() / 1000;
                            const timeUntilExpiry = payload.exp - currentTime;

                            // If token expires in less than 10 minutes, refresh it proactively
                            if (timeUntilExpiry < 600) { // 10 minutes
                                isRefreshingRef.current = true;
                                await refreshToken();
                            }
                        }
                    } catch (decodeError) {
                        // Silent fail - token refresh will retry on next check
                    }
                }
            } catch (error) {
                // Silent fail - token refresh will retry on next check
            } finally {
                isRefreshingRef.current = false;
            }
        };

        // Run initial check only if authenticated
        if (isAuthenticated) {
            checkAndRefreshToken();

            // Set up interval with authentication check
            intervalRef.current = setInterval(() => {
                if (isAuthenticated) {
                    checkAndRefreshToken();
                } else {
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                }
            }, 2 * 60 * 1000); // Check every 2 minutes
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            isRefreshingRef.current = false;
        };
    }, [isAuthenticated, refreshToken, logout]);
}

export default useTokenRefresh;
