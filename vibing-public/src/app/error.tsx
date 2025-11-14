'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
    const router = useRouter();

    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Application Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background relative px-4 py-6">
            <div className="w-full max-w-md px-4 sm:px-6 py-6 sm:py-8 bg-background rounded-lg shadow-sm border border-border/10">
                <div className="flex flex-col items-center justify-center space-y-6">
                    {/* Error Icon */}
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                        <svg
                            className="w-10 h-10 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    
                    {/* Error Message */}
                    <div className="text-center space-y-3">
                        <h1 className="text-2xl font-bold text-red-600">Terjadi Kesalahan</h1>
                        <p className="text-sm text-muted-foreground">
                            Maaf, terjadi kesalahan yang tidak terduga pada aplikasi.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Tim kami telah diberitahu tentang masalah ini dan sedang bekerja untuk memperbaikinya.
                        </p>
                        {process.env.NODE_ENV === 'development' && (
                            <details className="mt-4 p-3 bg-gray-50 rounded-md text-left">
                                <summary className="text-xs font-medium cursor-pointer">Detail Error (Development)</summary>
                                <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap break-words">
                                    {error.message}
                                </pre>
                            </details>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col w-full space-y-3">
                        <Button
                            onClick={reset}
                            className="w-full bg-primary hover:bg-primary/90 cursor-pointer"
                        >
                            Coba Lagi
                        </Button>
                        <Button
                            onClick={() => router.push('/')}
                            variant="outline"
                            className="w-full cursor-pointer"
                        >
                            Kembali ke Beranda
                        </Button>
                    </div>

                    {/* Help Links */}
                    <div className="text-center space-y-2">
                        <p className="text-xs text-muted-foreground">Masih bermasalah?</p>
                        <Button
                            onClick={() => window.location.reload()}
                            variant="ghost"
                            size="sm"
                            className="text-xs text-primary hover:text-primary/90 cursor-pointer"
                        >
                            Refresh Halaman
                        </Button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-xs text-muted-foreground px-4">
                © 2025 PT Vibing Global Media. All Rights Reserved
            </div>
        </div>
    );
}
