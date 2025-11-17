'use client';

import { useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import NotFound from '@/app/not-found';

interface URLValidatorProps {
    children: React.ReactNode;
}

const URLValidator = ({ children }: URLValidatorProps) => {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [isValidURL, setIsValidURL] = useState<boolean | null>(null);

    useEffect(() => {
        const validateURL = () => {
            const routeConfig: Record<string, string[]> = {
                '/': [],
                '/login': [],
                '/register': [],
                '/verify-otp': ['email', 'from'],
                '/reset-password': ['email', 'step', 'from'],
                '/dashboard': [],
                '/profile': [],
                '/attendance': [],
                '/event': ['from'],
                '/not-found': []
            };

            // Handle dynamic route /event/[slug]
            if (pathname.startsWith('/event/')) {
                const allowedParams = ['from'];
                const allParams = Array.from(searchParams.keys());
                const hasInvalidParams = allParams.some(param => !allowedParams.includes(param));
                
                if (hasInvalidParams) {
                    setIsValidURL(false);
                    return;
                }
                
                setIsValidURL(true);
                return;
            }

            const allowedParams = routeConfig[pathname];
            
            if (!allowedParams) {
                setIsValidURL(false);
                return;
            }

            const allParams = Array.from(searchParams.keys());
            const hasInvalidParams = allParams.some(param => !allowedParams.includes(param));

            if (hasInvalidParams) {
                setIsValidURL(false);
                return;
            }

            if (pathname === '/verify-otp') {
                const emailParam = searchParams.get('email');
                if (emailParam) {
                    try {
                        const decodedEmail = decodeURIComponent(emailParam);
                        if (!decodedEmail.includes('@') || !decodedEmail.includes('.')) {
                            setIsValidURL(false);
                            return;
                        }
                    } catch (error) {
                        setIsValidURL(false);
                        return;
                    }
                }
            }

            if (pathname === '/reset-password') {
                const stepParam = searchParams.get('step');
                const emailParam = searchParams.get('email');
                
                const validSteps = ['verify-otp', 'new-password'];
                
                if (stepParam && !validSteps.includes(stepParam)) {
                    setIsValidURL(false);
                    return;
                }

                if (emailParam) {
                    try {
                        const decodedEmail = decodeURIComponent(emailParam);
                        if (!decodedEmail.includes('@') || !decodedEmail.includes('.')) {
                            setIsValidURL(false);
                            return;
                        }
                    } catch (error) {
                        setIsValidURL(false);
                        return;
                    }
                }
            }

            setIsValidURL(true);
        };

        validateURL();
    }, [searchParams, pathname]);

    if (isValidURL === false) {
        return <NotFound />;
    }

    if (isValidURL === null) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background relative px-4 py-6">
                <div className="flex items-center justify-center">
                    <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default URLValidator;
