/**
 * Protected Route Component
 * Wraps components that require authentication
 * Compatible with Next.js 15.5.4 and React 19.1
 */

'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * Loading component for authentication check
 */
const AuthLoadingScreen = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center space-y-4">
            <div className="flex items-center justify-center">
                <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center mr-3">
                    <div className="w-4 h-4 bg-white rounded-sm"></div>
                </div>
                <span className="text-white text-xl font-bold">PlanHub</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Memverifikasi autentikasi...</span>
            </div>
        </div>
    </div>
);

/**
 * Protected Route Component
 * Handles authentication state and redirects
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    fallback = <AuthLoadingScreen />
}) => {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [shouldRedirect, setShouldRedirect] = useState(false);

    // Handle redirect in useEffect to avoid updating Router during render
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            setShouldRedirect(true);
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    // Show loading screen while checking authentication
    if (isLoading) {
        return <>{fallback}</>;
    }

    // Show loading screen while redirecting
    if (shouldRedirect || !isAuthenticated) {
        return <>{fallback}</>;
    }

    // Render protected content
    return <>{children}</>;
};

export default ProtectedRoute;
