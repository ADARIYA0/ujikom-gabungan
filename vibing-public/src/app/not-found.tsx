'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function NotFound() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background relative px-4 py-6">
            <div className="w-full max-w-md px-4 sm:px-6 py-6 sm:py-8 bg-background rounded-lg shadow-sm border border-border/10">
                <div className="flex flex-col items-center justify-center space-y-6">
                    {/* 404 Icon */}
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-4xl font-bold text-gray-600">?</span>
                    </div>
                    
                    {/* 404 Message */}
                    <div className="text-center space-y-3">
                        <h1 className="text-4xl font-bold text-gray-800">404</h1>
                        <h2 className="text-xl font-semibold text-gray-700">Halaman Tidak Ditemukan</h2>
                        <p className="text-sm text-muted-foreground">
                            Maaf, halaman yang Anda cari tidak dapat ditemukan.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Halaman mungkin telah dipindahkan, dihapus, atau URL yang Anda masukkan salah.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col w-full space-y-3">
                        <Button
                            onClick={() => router.push('/')}
                            className="w-full bg-primary hover:bg-primary/90 cursor-pointer"
                        >
                            Kembali ke Beranda
                        </Button>
                    </div>

                    {/* Help Links */}
                    <div className="text-center space-y-2">
                        <p className="text-xs text-muted-foreground">Butuh bantuan?</p>
                        <div className="flex justify-center space-x-4">
                            <Button
                                onClick={() => router.push('/register')}
                                variant="ghost"
                                size="sm"
                                className="text-xs text-primary hover:text-primary/90 cursor-pointer"
                            >
                                Daftar
                            </Button>
                            <Button
                                onClick={() => router.push('/login')}
                                variant="ghost"
                                size="sm"
                                className="text-xs text-primary hover:text-primary/90 cursor-pointer"
                            >
                                Masuk
                            </Button>
                        </div>
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
