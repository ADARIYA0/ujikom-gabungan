import { TokenManager } from './tokenManager';
import { ApiClient } from './apiClient';

export function decodeJWTPayload(token: string): any {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        return null;
    }
}

export function getUserIdFromToken(token: string): string | null {
    const payload = decodeJWTPayload(token);
    return payload?.id || null;
}

export function isAuthenticated(): boolean {
    const token = TokenManager.getAccessToken();
    return token !== null && !TokenManager.isTokenExpired();
}

export function getCurrentUser(): any | null {
    if (!isAuthenticated()) {
        return null;
    }
    return TokenManager.getUserData();
}

export async function authenticatedFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const result = await ApiClient.request(endpoint, options);
    return new Response(
        JSON.stringify(result.data || { message: result.error }),
        {
            status: result.success ? 200 : 400,
            statusText: result.success ? 'OK' : 'Error',
            headers: { 'Content-Type': 'application/json' }
        }
    );
}

export async function performLogout(): Promise<void> {
    try {
        await ApiClient.logout();
    } catch (error) {
        // Silent fail - logout will continue
    } finally {
        TokenManager.clearAllTokens();
    }
}

export function formatUserDisplayName(user: any): string {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
}

export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
