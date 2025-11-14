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
            console.log('useTokenRefresh: User not authenticated, stopping token refresh');
            isRefreshingRef.current = false;
            return;
        }

        const checkAndRefreshToken = async () => {
            // Double check authentication status before proceeding
            if (!isAuthenticated) {
                console.log('useTokenRefresh: Authentication lost during check, stopping');
                return;
            }

            // Prevent multiple simultaneous refresh attempts
            if (isRefreshingRef.current) {
                console.log('useTokenRefresh: Refresh already in progress, skipping check');
                return;
            }

            try {
                const accessToken = localStorage.getItem('accessToken');

                // If no token, don't attempt refresh
                if (!accessToken) {
                    console.log('useTokenRefresh: No access token found, skipping refresh');
                    return;
                }

                // Check if token is expired or will expire soon (within 5 minutes)
                if (AuthApiService.isTokenExpired(accessToken)) {
                    console.log('useTokenRefresh: Token expired, attempting refresh...');
                    isRefreshingRef.current = true;
                    await refreshToken();
                    console.log('useTokenRefresh: Token refresh completed successfully');
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

                            // If token expires in less than 5 minutes, refresh it
                            if (timeUntilExpiry < 300) { // 5 minutes
                                console.log('useTokenRefresh: Token expiring soon, refreshing...', {
                                    timeUntilExpiry: Math.floor(timeUntilExpiry),
                                    expiresAt: new Date(payload.exp * 1000).toLocaleTimeString()
                                });

                                isRefreshingRef.current = true;
                                await refreshToken();
                                console.log('useTokenRefresh: Proactive token refresh completed successfully');
                            }
                        }
                    } catch (decodeError) {
                        console.error('useTokenRefresh: Error checking token expiry:', decodeError);
                    }
                }
            } catch (error) {
                console.error('useTokenRefresh: Token refresh check failed:', error);

                // Enhanced error handling - only logout for specific refresh token errors
                if (error instanceof Error) {
                    if (error.message.includes('Refresh token tidak ditemukan') ||
                        error.message.includes('Refresh token tidak valid') ||
                        error.message.includes('Refresh token kadaluarsa')) {
                        console.log('useTokenRefresh: Refresh token invalid, but not auto-logging out');
                        console.log('useTokenRefresh: Let user continue - HTTP interceptor will handle auth appropriately');
                    } else if (error.message.includes('Failed to fetch') ||
                        error.message.includes('Network') ||
                        error.message.includes('Server error')) {
                        console.log('useTokenRefresh: Network/server error, will retry on next check');
                    } else {
                        console.log('useTokenRefresh: Unknown error, will retry on next check:', error.message);
                    }
                } else {
                    console.log('useTokenRefresh: Non-Error exception, will retry on next check');
                }
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
                    console.log('useTokenRefresh: Authentication lost, clearing interval');
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
