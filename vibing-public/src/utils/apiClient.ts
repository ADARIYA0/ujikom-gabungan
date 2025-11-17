import { TokenManager } from './tokenManager';
import { GlobalErrorHandler, type ApiResponse } from './globalErrorHandler';

export class ApiClient {
    private static baseURL = process.env.NEXT_PUBLIC_API_KEY;
    private static isRefreshing = false;
    private static refreshPromise: Promise<boolean> | null = null;

    static async request<T = any>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`;
        let accessToken = TokenManager.getAccessToken();

        if (accessToken && TokenManager.isTokenExpired()) {
            const refreshed = await this.refreshAccessToken();
            if (refreshed) {
                accessToken = TokenManager.getAccessToken();
            } else {
                TokenManager.clearAllTokens();
                return { success: false, error: 'Session expired. Please login again.' };
            }
        }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {}),
        };

        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        try {
            const controller = new AbortController();
            const timeout = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT!, 10);
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, {
                ...options,
                headers,
                credentials: 'include',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            const data = await response.json();

            if (response.ok) {
                return { success: true, data, message: data.message };
            } else {
                // Only refresh token for 401 errors that are NOT from check-in endpoint
                // Check-in errors should show the actual validation error message
                const isCheckInEndpoint = endpoint.includes('/checkin');
                const isAuthError = response.status === 401 && accessToken && !isCheckInEndpoint;
                
                if (isAuthError) {
                    const refreshed = await this.refreshAccessToken();
                    if (refreshed) {
                        return this.request(endpoint, options);
                    } else {
                        TokenManager.clearAllTokens();
                        return { success: false, error: 'Session expired. Please login again.' };
                    }
                }
                
                // For check-in and other validation errors, return the actual error message
                const errorMessage = data.message || response.statusText;
                
                // Use GlobalErrorHandler for error handling (but preserve original message for validation errors)
                if (isCheckInEndpoint || response.status === 400 || response.status === 404) {
                    // Return the actual validation error message
                    return { success: false, error: errorMessage, message: errorMessage };
                }
                
                const apiError = await GlobalErrorHandler.handleFetchError({
                    status: response.status,
                    message: errorMessage
                }, url);
                
                return { success: false, error: apiError.message, message: data.message };
            }
        } catch (error) {
            // Use GlobalErrorHandler for error handling
            const apiError = await GlobalErrorHandler.handleFetchError(error, url);
            return { success: false, error: apiError.message };
        }
    }

    private static async refreshAccessToken(): Promise<boolean> {
        if (this.isRefreshing) {
            if (this.refreshPromise) {
                return await this.refreshPromise;
            }
            return false;
        }

        this.isRefreshing = true;
        this.refreshPromise = this.performTokenRefresh();

        try {
            const result = await this.refreshPromise;
            return result;
        } finally {
            this.isRefreshing = false;
            this.refreshPromise = null;
        }
    }

    private static async performTokenRefresh(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.accessToken) {
                    const rememberMe = TokenManager.isRememberMe();
                    TokenManager.setAccessToken(data.accessToken, rememberMe);
                    return true;
                }
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    static async login(email: string, password: string): Promise<ApiResponse<{ accessToken: string }>> {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    static async logout(): Promise<ApiResponse> {
        const result = await this.request('/auth/logout', { method: 'POST' });
        TokenManager.clearAllTokens();
        return result;
    }

    static async checkServerStatus(): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT!, 10));
            const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_STATUS}`, {
                method: 'GET',
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // Use GlobalErrorHandler for error message handling
    static getErrorMessage(error: string | undefined): string {
        return GlobalErrorHandler.getErrorMessage(error);
    }
}
