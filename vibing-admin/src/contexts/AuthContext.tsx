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

            // Set cookie for middleware
            document.cookie = 'isAuthenticated=true; path=/; max-age=86400';

            // Login successful

            // Redirect to dashboard
            router.push('/');
        } catch (error) {
            console.error('AuthContext: Login failed:', error);

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
                    console.error('AuthContext: Logout API failed:', logoutError);
                    // Continue with local logout even if API fails
                }
            }
        } catch (error) {
            console.error('AuthContext: Logout error:', error);
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

                // Update cookie
                document.cookie = 'isAuthenticated=true; path=/; max-age=86400';
                // Token refresh completed
            }
        } catch (error) {
            console.error('AuthContext: Token refresh failed:', error);

            // Enhanced error handling - only logout for specific refresh token errors
            if (error instanceof Error) {
                const errorMessage = error.message.toLowerCase();

                // Only logout for actual refresh token issues
                if (errorMessage.includes('refresh token tidak ditemukan') ||
                    errorMessage.includes('refresh token tidak valid') ||
                    errorMessage.includes('refresh token kadaluarsa') ||
                    errorMessage.includes('refresh token expired')) {
                    // Refresh token invalid, logging out
                    await logout();
                } else {
                    // For network errors or server errors, don't logout
                    // Network error during refresh
                }
            }

            throw error;
        } finally {
            setIsRefreshing(false);
        }
    };

    /**
     * Check authentication status on app load
     */
    const checkAuthStatus = async (): Promise<void> => {
        try {
            const accessToken = localStorage.getItem('accessToken');
            // Checking authentication status

            if (accessToken) {
                // Check if token is expired
                if (AuthApiService.isTokenExpired(accessToken)) {
                    // Access token expired, refreshing
                    // Try to refresh token
                    try {
                        await refreshToken();
                        return;
                    } catch (error) {
                        // Token refresh failed during check
                        // Only logout if it's a refresh token issue, not network error
                        if (error instanceof Error && (
                            error.message.includes('Refresh token tidak ditemukan') ||
                            error.message.includes('Refresh token tidak valid') ||
                            error.message.includes('Refresh token kadaluarsa')
                        )) {
                            await logout();
                        }
                        return;
                    }
                }

                // Token is valid, decode user info
                const userData = AuthApiService.decodeToken(accessToken);
                if (userData) {
                    setUser(userData);
                    setIsAuthenticated(true);

                    // Set cookie for middleware
                    document.cookie = 'isAuthenticated=true; path=/; max-age=86400';
                    // User authenticated with valid token
                } else {
                    // Invalid token data, clearing state
                    await logout();
                }
            } else {
                // No access token found
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error('AuthContext: Error checking auth status:', error);
            // Don't logout on errors - could be network issues
            // Keeping current auth state due to error
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

                            // If token expires in less than 5 minutes, refresh it
                            if (timeUntilExpiry < 300) {
                                // Token expiring soon, refreshing
                                await refreshToken();
                            }
                        }
                    } catch (decodeError) {
                        console.error('AuthContext: Error checking token expiry:', decodeError);
                    }
                }
            } catch (error) {
                console.error('AuthContext: Auto refresh failed:', error);
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
