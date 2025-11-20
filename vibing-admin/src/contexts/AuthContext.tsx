/**
 * Authentication Context for Admin PlanHub
 * Provides global authentication state management with TypeScript null-safety
 * Compatible with Next.js 15.5.4 and React 19.1
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import AuthApiService, { AdminUser, LoginCredentials } from '@/services/authService';

// Context types with null-safety
interface AuthContextType {
    user: AdminUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isRefreshing: boolean;
    login: (identifier: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<void>;
    checkAuthStatus: () => Promise<void>;
}

// Create context with null-safety
const AuthContext = createContext<AuthContextType | null>(null);

// Custom hook with null-safety
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Provider props interface
interface AuthProviderProps {
    children: ReactNode;
}

/**
 * Authentication Provider Component
 * Manages global authentication state and provides auth methods
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<AdminUser | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const router = useRouter();

    /**
     * Login function with error handling
     */
    const login = async (identifier: string, password: string): Promise<void> => {
        try {
            // Login process started
            setIsLoading(true);

            const credentials: LoginCredentials = { identifier, password };
            const response = await AuthApiService.login(credentials);

            // Store access token
            localStorage.setItem('accessToken', response.accessToken);

            // Decode user information from token
            const userData = AuthApiService.decodeToken(response.accessToken);
            if (!userData) {
                throw new Error('Invalid token received from server');
            }

            // Update state
            setUser(userData);
            setIsAuthenticated(true);

            // Set cookie for middleware (persistent - 30 days like Remember Me)
            document.cookie = 'isAuthenticated=true; path=/; max-age=2592000';

            // Login successful

            // Redirect to dashboard
            router.push('/');
        } catch (error) {
            // Clear any existing state
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem('accessToken');

            // Re-throw error for UI handling
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Logout function with cleanup
     */
    const logout = async (): Promise<void> => {
        try {
            const accessToken = localStorage.getItem('accessToken');
            // Logout process started

            if (accessToken) {
                // Call logout API to invalidate tokens
                try {
                    await AuthApiService.logout(accessToken);
                    // Logout API successful
                } catch (logoutError) {
                    // Continue with local logout even if API fails
                }
            }
        } catch (error) {
            // Silent fail - logout will continue
        } finally {
            // Clearing local storage and cookies

            // Clear local storage
            localStorage.removeItem('accessToken');

            // Clear cookies with multiple paths to ensure complete cleanup
            const cookiePaths = ['/', '/api/auth/refresh-token', '/api/auth'];
            cookiePaths.forEach(path => {
                document.cookie = `isAuthenticated=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
                document.cookie = `refreshToken=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            });

            // Reset state
            setUser(null);
            setIsAuthenticated(false);
            setIsRefreshing(false);

            // Logout completed, redirecting
            router.push('/login');
        }
    };

    /**
     * Token refresh function
     */
    const refreshToken = async (): Promise<void> => {
        // Prevent multiple simultaneous refresh attempts
        if (isRefreshing) {
            // Token refresh in progress
            // Wait for current refresh to complete
            while (isRefreshing) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return;
        }

        setIsRefreshing(true);
        try {
            // Starting token refresh
            const response = await AuthApiService.refreshToken();

            // Store new access token
            localStorage.setItem('accessToken', response.accessToken);

            // Update user data with new token info
            const userData = AuthApiService.decodeToken(response.accessToken);
            if (userData) {
                setUser(prevUser => ({ ...prevUser, ...userData }));
                setIsAuthenticated(true);

                // Update cookie (persistent - 30 days like Remember Me)
                document.cookie = 'isAuthenticated=true; path=/; max-age=2592000';
                // Token refresh completed
            }
        } catch (error) {
            // Enhanced error handling - only logout for specific refresh token errors
            if (error instanceof Error) {
                const errorMessage = error.message.toLowerCase();

                // Only logout for actual refresh token issues (not network errors)
                if (errorMessage.includes('refresh token tidak ditemukan') ||
                    errorMessage.includes('refresh token tidak valid') ||
                    errorMessage.includes('refresh token kadaluarsa') ||
                    errorMessage.includes('refresh token expired')) {
                    // Refresh token invalid, logging out
                    await logout();
                } else {
                    // For network errors or server errors, don't logout
                    // Keep current auth state - user might still be authenticated
                    // Network error during refresh, but user might still have valid session
                    const accessToken = localStorage.getItem('accessToken');
                    if (accessToken && !AuthApiService.isTokenExpired(accessToken)) {
                        // Token still valid, keep user authenticated
                        const userData = AuthApiService.decodeToken(accessToken);
                        if (userData) {
                            setUser(userData);
                            setIsAuthenticated(true);
                        }
                    }
                }
            }

            throw error;
        } finally {
            setIsRefreshing(false);
        }
    };

    /**
     * Check authentication status on app load
     * With persistent login (Remember Me) support
     */
    const checkAuthStatus = async (): Promise<void> => {
        try {
            const accessToken = localStorage.getItem('accessToken');
            // Checking authentication status

            if (accessToken) {
                // Check if token is expired or will expire soon (within 10 minutes)
                const isExpired = AuthApiService.isTokenExpired(accessToken);
                let shouldRefresh = isExpired;

                // If token is not expired, check if it will expire soon
                if (!isExpired) {
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
                            
                            // Refresh if token expires in less than 10 minutes
                            shouldRefresh = timeUntilExpiry < 600;
                        }
                    } catch (decodeError) {
                        // If we can't decode, assume token is valid and don't refresh
                        shouldRefresh = false;
                    }
                }

                if (shouldRefresh) {
                    // Access token expired or expiring soon, try to refresh
                    try {
                        await refreshToken();
                        return;
                    } catch (error) {
                        // Token refresh failed - but don't logout immediately
                        // Refresh token might still be valid, just network issue
                        if (error instanceof Error) {
                            const errorMessage = error.message.toLowerCase();
                            
                            // Only logout if refresh token is actually invalid/expired
                            if (errorMessage.includes('refresh token tidak ditemukan') ||
                                errorMessage.includes('refresh token tidak valid') ||
                                errorMessage.includes('refresh token kadaluarsa') ||
                                errorMessage.includes('refresh token expired')) {
                                // Refresh token is invalid, must logout
                                await logout();
                                return;
                            }
                        }
                        
                        // For network errors or other issues, keep current state
                        // User might still be authenticated, just can't refresh right now
                        // Try to use existing token if it's still valid
                        if (!isExpired) {
                            const userData = AuthApiService.decodeToken(accessToken);
                            if (userData) {
                                setUser(userData);
                                setIsAuthenticated(true);
                                document.cookie = 'isAuthenticated=true; path=/; max-age=2592000';
                            }
                        }
                        return;
                    }
                }

                // Token is valid, decode user info
                const userData = AuthApiService.decodeToken(accessToken);
                if (userData) {
                    setUser(userData);
                    setIsAuthenticated(true);

                    // Set cookie for middleware (persistent - 30 days like Remember Me)
                    document.cookie = 'isAuthenticated=true; path=/; max-age=2592000';
                    // User authenticated with valid token
                } else {
                    // Invalid token data, try to refresh before logging out
                    try {
                        await refreshToken();
                    } catch (refreshError) {
                        // Only logout if refresh also fails
                        await logout();
                    }
                }
            } else {
                // No access token found, but check if refresh token exists (persistent login)
                // Try to refresh to get new access token
                try {
                    await refreshToken();
                } catch (error) {
                    // No refresh token or invalid, user needs to login
                    setUser(null);
                    setIsAuthenticated(false);
                }
            }
        } catch (error) {
            // Don't logout on errors - could be network issues
            // Keep current auth state if we have a token
            const accessToken = localStorage.getItem('accessToken');
            if (accessToken && !AuthApiService.isTokenExpired(accessToken)) {
                const userData = AuthApiService.decodeToken(accessToken);
                if (userData) {
                    setUser(userData);
                    setIsAuthenticated(true);
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Initialize authentication state on mount
     */
    useEffect(() => {
        checkAuthStatus();
    }, []);

    /**
     * Set up automatic token refresh
     */
    useEffect(() => {
        if (!isAuthenticated) return;

        const checkAndRefreshToken = async () => {
            try {
                const accessToken = localStorage.getItem('accessToken');
                if (!accessToken) return;

                // Check if token will expire in next 5 minutes
                if (AuthApiService.isTokenExpired(accessToken)) {
                    // Token expired, refreshing
                    await refreshToken();
                } else {
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
                            if (timeUntilExpiry < 600) {
                                // Token expiring soon, refreshing proactively
                                await refreshToken();
                            }
                        }
                    } catch (decodeError) {
                        // Silent fail - token refresh will retry
                    }
                }
            } catch (error) {
                // Silent fail - token refresh will retry
            }
        };

        // Initial check
        checkAndRefreshToken();

        // Set up interval for periodic checks
        const interval = setInterval(checkAndRefreshToken, 2 * 60 * 1000); // Every 2 minutes

        return () => clearInterval(interval);
    }, [isAuthenticated]);

    /**
     * Context value with all auth methods and state
     */
    const contextValue: AuthContextType = {
        user,
        isAuthenticated,
        isLoading,
        isRefreshing,
        login,
        logout,
        refreshToken,
        checkAuthStatus,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
