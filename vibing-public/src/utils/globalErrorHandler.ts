export interface ApiRequestOptions extends RequestInit {
    timeout?: number;
}

export interface ApiError {
    message: string;
    type: 'timeout' | 'network' | 'server' | 'validation';
    status?: number;
    details?: any;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export class GlobalErrorHandler {
    private static readonly DEFAULT_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT!, 10);

    static createError(type: ApiError['type'], message: string, status?: number, details?: any): ApiError {
        return { type, message, status, details };
    }

    static async handleFetchError(error: any, url: string): Promise<ApiError> {
        // Timeout error (both AbortError and our custom timeout)
        if (error.name === 'AbortError' || (error instanceof Error && error.message === 'AbortError')) {
            return this.createError(
                'timeout',
                'Koneksi timeout. Silakan periksa koneksi internet Anda dan coba lagi.',
                408
            );
        }

        // Network error (no internet, server down, etc.)
        if (error instanceof TypeError && error.message.includes('fetch')) {
            // Skip connectivity test and directly treat as timeout for consistency
            return this.createError(
                'timeout',
                'Koneksi timeout. Silakan periksa koneksi internet Anda dan coba lagi.',
                503
            );
        }

        // Server error (5xx status codes) - treat as timeout
        if (error.status >= 500) {
            return this.createError(
                'timeout',
                'Koneksi timeout. Silakan periksa koneksi internet Anda dan coba lagi.',
                error.status
            );
        }

        // Client error (4xx status codes)
        if (error.status >= 400 && error.status < 500) {
            return this.createError(
                'validation',
                error.message || 'Terjadi kesalahan validasi.',
                error.status,
                error
            );
        }

        // Generic error - treat as timeout
        return this.createError(
            'timeout',
            'Koneksi timeout. Silakan periksa koneksi internet Anda dan coba lagi.',
            500,
            error
        );
    }

    static async apiRequest<T = any>(
        url: string, 
        options: ApiRequestOptions = {}
    ): Promise<ApiResponse<T>> {
        const { timeout = this.DEFAULT_TIMEOUT, ...fetchOptions } = options;

        
        const startTime = Date.now();

        try {
            // Use XMLHttpRequest for better timeout control
            const response = await new Promise<Response>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.timeout = timeout; // Set actual timeout
                xhr.open(fetchOptions.method || 'GET', url);
                
                // Set headers
                if (fetchOptions.headers) {
                    const headers = fetchOptions.headers as Record<string, string>;
                    Object.entries(headers).forEach(([key, value]) => {
                        xhr.setRequestHeader(key, value);
                    });
                }
                
                xhr.onload = () => {
                    // Create Response-like object
                    const response = new Response(xhr.responseText, {
                        status: xhr.status,
                        statusText: xhr.statusText,
                        headers: new Headers()
                    });
                    resolve(response);
                };
                
                xhr.onerror = () => {
                    const duration = Date.now() - startTime;
                    
                    // If network error happens too quickly, it means server is completely down
                    // In this case, we should simulate a timeout to give user proper feedback
                    if (duration < timeout) {
                        setTimeout(() => {
                            const error = new Error('Request timeout');
                            error.name = 'AbortError';
                            reject(error);
                        }, timeout - duration);
                    } else {
                        reject(new TypeError('NetworkError when attempting to fetch resource.'));
                    }
                };
                
                xhr.ontimeout = () => {
                    const error = new Error('Request timeout');
                    error.name = 'AbortError';
                    reject(error);
                };
                
                // Send request
                xhr.send(fetchOptions.body as string || null);
            });

            const data = await response.json();

            if (!response.ok) {
                const apiError = await this.handleFetchError({
                    status: response.status,
                    message: data.message || response.statusText
                }, url);
                
                return {
                    success: false,
                    error: apiError.message,
                    data: data
                };
            }

            return {
                success: true,
                data: data,
                message: data.message
            };

        } catch (error) {
            const apiError = await this.handleFetchError(error, url);
            
            return {
                success: false,
                error: apiError.message
            };
        }
    }

    static getErrorMessage(error: string | undefined): string {
        if (!error) return 'Terjadi kesalahan yang tidak terduga.';
        
        // Map specific error messages to user-friendly messages
        const errorMap: Record<string, string> = {
            'User not found': 'User tidak ditemukan',
            'Invalid credentials': 'Email atau Password salah',
            'Account not verified': 'Akun belum terverifikasi. Silakan verifikasi lewat OTP.',
            'Email already exists': 'Email sudah terdaftar',
            'Invalid OTP': 'Kode OTP salah',
            'OTP expired': 'Kode OTP sudah kedaluwarsa',
            'Too many attempts': 'Terlalu banyak percobaan. Silakan coba lagi nanti.',
            'Wrong OTP': 'Kode OTP salah',
            'The OTP has expired.': 'Kode OTP sudah kedaluwarsa.',
            'Invalid OTP or no active reset request.': 'Kode OTP tidak valid atau tidak ada permintaan reset aktif.',
            'Email and OTP are required.': 'Email dan OTP wajib diisi.',
            'Too many attempts. Try again later.': 'Terlalu banyak percobaan. Silakan coba lagi nanti.',
            'Email is not registered': 'Email tidak terdaftar. Silakan periksa kembali email Anda.',
        };

        return errorMap[error] || error;
    }

    static shouldPreventNavigation(error: ApiError): boolean {
        return error.type === 'network' || error.type === 'timeout' || error.type === 'server';
    }
}

// Export convenience functions for backward compatibility
export const apiRequest = GlobalErrorHandler.apiRequest.bind(GlobalErrorHandler);
export const getErrorMessage = GlobalErrorHandler.getErrorMessage.bind(GlobalErrorHandler);
export const shouldPreventNavigation = GlobalErrorHandler.shouldPreventNavigation.bind(GlobalErrorHandler);
