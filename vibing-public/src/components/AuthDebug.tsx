'use client';

import { useAuth } from '@/contexts/AuthContext';
import { TokenManager } from '@/utils/tokenManager';
import { useEffect, useState } from 'react';

export function AuthDebug() {
    const { user, isLoggedIn, loading } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (process.env.NODE_ENV !== 'development' || !mounted) {
        return null;
    }

    // Check token storage (safe after mounted)
    const accessToken = TokenManager.getAccessToken();
    const userData = TokenManager.getUserData();
    const rememberMe = TokenManager.isRememberMe();
    const isTokenExpired = TokenManager.isTokenExpired();

    // Check localStorage and sessionStorage directly (safe after mounted)
    const localStorageTokens = {
        accessToken: localStorage.getItem('accessToken'),
        tokenExpiry: localStorage.getItem('tokenExpiry'),
        rememberMe: localStorage.getItem('rememberMe'),
        userData: localStorage.getItem('userData')
    };

    const sessionStorageTokens = {
        accessToken: sessionStorage.getItem('accessToken'),
        tokenExpiry: sessionStorage.getItem('tokenExpiry'),
        userData: sessionStorage.getItem('userData')
    };

    return (
        <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs max-w-sm z-50 max-h-96 overflow-y-auto">
            <h3 className="font-bold mb-2 text-yellow-300">Auth Debug</h3>
            
            <div className="mb-2">
                <div className="text-green-300">Auth State:</div>
                <div>Loading: {loading ? 'true' : 'false'}</div>
                <div>Is Logged In: {isLoggedIn ? 'true' : 'false'}</div>
                <div>User: {user ? JSON.stringify(user, null, 2) : 'null'}</div>
            </div>

            <div className="mb-2">
                <div className="text-blue-300">Token Manager:</div>
                <div>Access Token: {accessToken ? 'EXISTS' : 'NULL'}</div>
                <div>User Data: {userData ? 'EXISTS' : 'NULL'}</div>
                <div>Remember Me: {rememberMe ? 'true' : 'false'}</div>
                <div>Token Expired: {isTokenExpired ? 'true' : 'false'}</div>
            </div>

            <div className="mb-2">
                <div className="text-orange-300">LocalStorage:</div>
                <div>Access Token: {localStorageTokens.accessToken ? 'EXISTS' : 'NULL'}</div>
                <div>Token Expiry: {localStorageTokens.tokenExpiry ? 'EXISTS' : 'NULL'}</div>
                <div>Remember Me: {localStorageTokens.rememberMe ? 'EXISTS' : 'NULL'}</div>
                <div>User Data: {localStorageTokens.userData ? 'EXISTS' : 'NULL'}</div>
            </div>

            <div className="mb-2">
                <div className="text-purple-300">SessionStorage:</div>
                <div>Access Token: {sessionStorageTokens.accessToken ? 'EXISTS' : 'NULL'}</div>
                <div>Token Expiry: {sessionStorageTokens.tokenExpiry ? 'EXISTS' : 'NULL'}</div>
                <div>User Data: {sessionStorageTokens.userData ? 'EXISTS' : 'NULL'}</div>
            </div>
        </div>
    );
}
