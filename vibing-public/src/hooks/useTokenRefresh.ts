import { useEffect, useRef } from 'react';
import { TokenManager } from '@/utils/tokenManager';
import { ApiClient } from '@/utils/apiClient';

export function useTokenRefresh() {
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isRefreshingRef = useRef(false);

    useEffect(() => {
        const startTokenRefreshTimer = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }

            intervalRef.current = setInterval(async () => {
                const accessToken = TokenManager.getAccessToken();

                if (!accessToken || isRefreshingRef.current) {
                    return;
                }

                const timeUntilExpiry = TokenManager.getTimeUntilExpiry();
                const twoMinutesInMs = 2 * 60 * 1000;

                if (timeUntilExpiry <= twoMinutesInMs && timeUntilExpiry > 0) {
                    try {
                        isRefreshingRef.current = true;
                        const refreshResult = await ApiClient.request('/auth/refresh-token', {
                            method: 'POST'
                        });

                        if (refreshResult.success && refreshResult.data?.accessToken) {
                            const rememberMe = TokenManager.isRememberMe();
                            TokenManager.setAccessToken(refreshResult.data.accessToken, rememberMe);
                        }
                    } catch (error) {
                        console.error('Background token refresh error:', error);
                    } finally {
                        isRefreshingRef.current = false;
                    }
                }
            }, 5 * 60 * 1000);
        };

        const accessToken = TokenManager.getAccessToken();
        if (accessToken) {
            startTokenRefreshTimer();
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    const checkAndRefreshToken = async (): Promise<boolean> => {
        const accessToken = TokenManager.getAccessToken();

        if (!accessToken || isRefreshingRef.current) {
            return false;
        }

        if (TokenManager.isTokenExpired()) {
            try {
                isRefreshingRef.current = true;
                const refreshResult = await ApiClient.request('/auth/refresh-token', {
                    method: 'POST'
                });

                if (refreshResult.success && refreshResult.data?.accessToken) {
                    const rememberMe = TokenManager.isRememberMe();
                    TokenManager.setAccessToken(refreshResult.data.accessToken, rememberMe);
                    return true;
                }
                return false;
            } catch (error) {
                return false;
            } finally {
                isRefreshingRef.current = false;
            }
        }
        return true;
    };

    return {
        checkAndRefreshToken,
        isRefreshing: isRefreshingRef.current
    };
}
