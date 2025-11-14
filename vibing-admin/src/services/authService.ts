/**
 * Authentication Service for Admin PlanHub
 * Handles admin login, token management, and authentication state
 * Compatible with Next.js 15.5.4 and React 19.1
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_KEY;

if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_KEY is not defined in environment variables');
}

// Types for authentication
export interface LoginCredentials {
    identifier: string; // Can be email or username
    password: string;
}

export interface LoginResponse {
    message: string;
    accessToken: string;
}

export interface AdminUser {
    id: number;
    email: string;
    username: string;
    role: 'admin';
    iat?: number;
    exp?: number;
}

export interface RefreshTokenResponse {
    accessToken: string;
}

/**
 * Authentication Service Class
 * Provides methods for admin authentication and token management
 */
export class AuthApiService {
    private static getHeaders(includeAuth: boolean = false): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (includeAuth) {
            const token = localStorage.getItem('accessToken');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    }

    private static getAuthHeaders(token: string): Record<string, string> {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    }

    /**
     * Admin login with identifier (email or username) and password
     */
    static async login(credentials: LoginCredentials): Promise<LoginResponse> {
        try {
            // Attempting admin login

            const response = await fetch(`${API_BASE_URL}/auth/admin/login`, {
                method: 'POST',
                headers: this.getHeaders(),
                credentials: 'include', // Important for cookies
                body: JSON.stringify(credentials),
                cache: 'no-cache',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
                console.error('AuthService: Login failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                });

                if (response.status === 404) {
                    throw new Error('Admin tidak ditemukan');
                } else if (response.status === 400) {
                    throw new Error('Email/Username atau password salah');
                } else if (response.status === 403) {
                    throw new Error('Akun admin tidak aktif');
                }

                throw new Error(errorData.message || 'Login gagal');
            }

            const data = await response.json();
            // Login successful
            return data;
        } catch (error) {
            console.error('AuthService: Login error:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Terjadi kesalahan saat login');
        }
    }

    /**
     * Token refresh using httpOnly refresh token cookie
     */
    static async refreshToken(): Promise<RefreshTokenResponse> {
        try {
            // Attempting token refresh

            const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
                method: 'POST',
                credentials: 'include', // Important for cookies
                headers: this.getHeaders(),
                cache: 'no-cache',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Token refresh failed' }));
                console.error('AuthService: Token refresh failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                });

                if (response.status === 401) {
                    throw new Error('Refresh token tidak ditemukan');
                } else if (response.status === 403) {
                    throw new Error('Refresh token tidak valid atau sudah expired');
                }

                throw new Error(errorData.message || 'Token refresh failed');
            }

            const data = await response.json();
            // Token refresh successful
            return data;
        } catch (error) {
            console.error('AuthService: Token refresh error:', error);
            throw error;
        }
    }

    /**
     * Logout admin and invalidate tokens
     */
    static async logout(token: string): Promise<void> {
        try {
            // Attempting logout

            const response = await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: this.getAuthHeaders(token),
                credentials: 'include',
                cache: 'no-cache',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Logout failed' }));
                console.error('AuthService: Logout failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                });

                // Don't throw error for logout - always proceed with local cleanup
                // Logout API failed, continuing with cleanup
                return;
            }

            // Logout successful
        } catch (error) {
            console.error('AuthService: Logout error:', error);
            // Don't throw error for logout - always proceed with local cleanup
            // Logout failed, continuing with cleanup
        }
    }

    /**
     * Decode JWT token to get user information
     */
    static decodeToken(token: string): AdminUser | null {
        try {
            if (!token) return null;

            const base64Url = token.split('.')[1];
            if (!base64Url) return null;

            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );

            const payload = JSON.parse(jsonPayload);

            // Validate required fields for admin user
            if (!payload.id || payload.role !== 'admin') {
                // Invalid token payload for admin user
                return null;
            }

            return {
                id: payload.id,
                email: payload.email || '',
                username: payload.username || '',
                role: 'admin',
                iat: payload.iat,
                exp: payload.exp,
            };
        } catch (error) {
            console.error('AuthService: Token decode error:', error);
            return null;
        }
    }

    /**
     * Check if token is expired
     */
    static isTokenExpired(token: string): boolean {
        try {
            if (!token) return true;

            const base64Url = token.split('.')[1];
            if (!base64Url) return true;

            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );

            const payload = JSON.parse(jsonPayload);
            const currentTime = Date.now() / 1000;

            return payload.exp <= currentTime;
        } catch (error) {
            console.error('AuthService: Token expiry check error:', error);
            return true;
        }
    }

    /**
     * Get current authenticated admin user
     */
    static getCurrentUser(): AdminUser | null {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return null;

            return this.decodeToken(token);
        } catch (error) {
            console.error('AuthService: Get current user error:', error);
            return null;
        }
    }

    /**
     * Check if user is authenticated with valid token
     */
    static isAuthenticated(): boolean {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return false;

            if (this.isTokenExpired(token)) {
                // Token expired, user not authenticated
                return false;
            }

            const user = this.decodeToken(token);
            return user !== null && user.role === 'admin';
        } catch (error) {
            console.error('AuthService: Authentication check error:', error);
            return false;
        }
    }
}

export default AuthApiService;
