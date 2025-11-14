'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { TokenManager } from '@/utils/tokenManager';
import { ApiClient } from '@/utils/apiClient';
import { GlobalErrorHandler } from '@/utils/globalErrorHandler';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string }>;
    logout: () => Promise<{ success: boolean; message?: string }>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    
    const isLoggedIn = !!user;
    
    useTokenRefresh();
    
    // Session timeout with 5 minutes inactivity
    useSessionTimeout({
        timeoutDuration: 5 * 60 * 1000, // 5 minutes
        warningDuration: 1 * 60 * 1000, // 1 minute warning
        isLoggedIn,
        onTimeout: () => {
            console.log('Session timeout - auto logout');
            // Force logout without API call since it's timeout
            TokenManager.clearAllTokens();
            setUser(null);
        },
        onWarning: () => {
            console.log('Session timeout warning - 1 minute remaining');
            // You can show a warning modal here if needed
        }
    });

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const accessToken = TokenManager.getAccessToken();
                const userData = TokenManager.getUserData();
                const rememberMe = TokenManager.isRememberMe();

                if (!rememberMe) {
                    const isServerReachable = await ApiClient.checkServerStatus();
                    if (isServerReachable && accessToken) {
                        await fetch(`${process.env.NEXT_PUBLIC_API_KEY}/auth/logout`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json',
                            },
                            credentials: 'include',
                        });
                    }
                    TokenManager.clearAllTokens();
                    setUser(null);
                    return;
                }

                if (accessToken && userData) {
                    if (TokenManager.isTokenExpired()) {
                        const refreshResult = await ApiClient.request('/auth/refresh-token', {
                            method: 'POST'
                        });

                        if (refreshResult.success && refreshResult.data?.accessToken) {
                            TokenManager.setAccessToken(refreshResult.data.accessToken, rememberMe);
                            setUser(userData);
                        } else {
                            TokenManager.clearAllTokens();
                            setUser(null);
                        }
                    } else {
                        setUser(userData);
                    }
                } else {
                    TokenManager.clearAllTokens();
                    setUser(null);
                }
            } catch (error) {
                TokenManager.clearAllTokens();
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(checkAuthStatus, 100);
        return () => clearTimeout(timeoutId);
    }, []);

    const login = async (email: string, password: string, rememberMe: boolean = false): Promise<{ success: boolean; message?: string }> => {
        try {
            setLoading(true);

            const loginResult = await ApiClient.login(email, password);

            if (loginResult.success && loginResult.data?.accessToken) {
                // Store access token
                TokenManager.setAccessToken(loginResult.data.accessToken, rememberMe);
                
                // Decode JWT token to get user data
                const decodedToken = TokenManager.decodeJWT(loginResult.data.accessToken);
                if (decodedToken) {
                    const userData: User = {
                        id: decodedToken.id,
                        name: decodedToken.email.split('@')[0], // Use email prefix as name
                        email: decodedToken.email,
                        role: decodedToken.role || 'user'
                    };
                    
                    // Store user data
                    TokenManager.setUserData(userData, rememberMe);
                    
                    setUser(userData);
                    return { success: true };
                } else {
                    return {
                        success: false,
                        message: 'Token tidak valid. Silakan coba lagi.'
                    };
                }
            } else {
                return {
                    success: false,
                    message: loginResult.error || loginResult.message || 'Login gagal. Silakan coba lagi.'
                };
            }
        } catch (error) {
            const errorMessage = GlobalErrorHandler.getErrorMessage(
                error instanceof Error ? error.message : 'Login gagal. Silakan coba lagi.'
            );
            return {
                success: false,
                message: errorMessage
            };
        } finally {
            setLoading(false);
        }
    };

    const logout = async (): Promise<{ success: boolean; message?: string }> => {
        try {
            // Always clear tokens locally first for security
            TokenManager.clearAllTokens();
            setUser(null);
            
            // Try to notify server about logout (best effort)
            const isServerReachable = await ApiClient.checkServerStatus();
            
            if (isServerReachable) {
                // Server is reachable, attempt logout API call
                // Note: ApiClient.logout() also calls TokenManager.clearAllTokens() but it's safe to call multiple times
                const logoutResult = await ApiClient.logout();
                
                return logoutResult.success ? 
                    { success: true, message: 'Logout berhasil' } : 
                    { success: true, message: 'Logout berhasil (server notification failed)' };
            } else {
                // Server not reachable, but local logout is successful
                return {
                    success: true,
                    message: 'Logout berhasil (server tidak dapat dijangkau)'
                };
            }
        } catch (error) {
            // Even if API call fails, local logout is successful
            // Tokens are already cleared above
            return {
                success: true,
                message: 'Logout berhasil (server notification failed)'
            };
        }
    };

    const value: AuthContextType = {
        user,
        isLoggedIn,
        login,
        logout,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
