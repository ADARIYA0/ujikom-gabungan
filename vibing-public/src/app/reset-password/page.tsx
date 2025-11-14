'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef, Suspense } from 'react';
import { apiRequest, getErrorMessage } from '@/utils/globalErrorHandler';

type ResetStep = 'email' | 'new-password';

// Helper function to format OTP error messages with attempt count
const getResetOTPErrorMessage = (errorMessage: string, backendData?: any): string => {
    if (errorMessage === 'Invalid OTP') {
        if (backendData && backendData.remainingAttempts !== undefined) {
            const remainingAttempts = backendData.remainingAttempts;
            
            if (remainingAttempts > 1) {
                return `Kode OTP yang Anda masukkan salah. Anda memiliki ${remainingAttempts} percobaan lagi.`;
            } else if (remainingAttempts === 1) {
                return 'Kode OTP yang Anda masukkan salah. Anda memiliki 1 percobaan terakhir.';
            } else if (remainingAttempts === 0) {
                return 'Anda telah memasukkan kode OTP yang salah terlalu banyak. Silakan coba lagi dalam beberapa menit.';
            }
        }
        return 'Kode OTP yang Anda masukkan salah. Silakan periksa kembali dan coba lagi.';
    }
    
    if (errorMessage.includes('Too many invalid OTP attempts')) {
        const match = errorMessage.match(/Try again in (\d+) minute\(s\)/);
        if (match) {
            const minutes = match[1];
            return `Anda telah memasukkan kode OTP yang salah terlalu banyak. Silakan coba lagi dalam ${minutes} menit.`;
        }
        return 'Anda telah memasukkan kode OTP yang salah terlalu banyak. Silakan coba lagi nanti.';
    }
    
    // Return original message for other errors
    return errorMessage;
};

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [step, setStep] = useState<ResetStep>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [emailError, setEmailError] = useState('');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Initialize step and email from URL parameters
    useEffect(() => {
        const emailParam = searchParams.get('email');
        const stepParam = searchParams.get('step') as ResetStep;
        const fromEmail = searchParams.get('from');
        
        if (emailParam) {
            const decodedEmail = decodeURIComponent(emailParam);
            setEmail(decodedEmail);
            
            if (stepParam === 'new-password') {
                setStep(stepParam);
                
                // Show success message when coming from email step to new-password
                if (stepParam === 'new-password' && fromEmail === 'email') {
                    const messageShownKey = `reset_message_shown_${decodedEmail}`;
                    const messageAlreadyShown = sessionStorage.getItem(messageShownKey);
                    
                    if (!messageAlreadyShown) {
                        setSuccess('Kode verifikasi telah dikirim ke email Anda. Silakan masukkan kode OTP dan password baru.');
                        setCountdown(60);
                        
                        // Mark message as shown and remove URL parameter
                        sessionStorage.setItem(messageShownKey, 'true');
                        const newUrl = new URL(window.location.href);
                        newUrl.searchParams.delete('from');
                        window.history.replaceState({}, '', newUrl.toString());
                    }
                }
            } else {
                setStep('new-password'); // Default to new-password if email is present
            }
        } else {
            setStep('email'); // Default to email step if no email in URL
        }
    }, [searchParams]);


    // Countdown timer for resend OTP
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const validateEmail = (email: string) => {
        if (!email) {
            return 'Email wajib diisi';
        } else if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            return 'Email tidak valid';
        }
        return '';
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEmail = e.target.value;
        setEmail(newEmail);
        
        if (emailError) {
            setEmailError('');
        }
    };

    const handleBack = () => {
        // Clear error and success messages when navigating back
        setError('');
        setSuccess('');

        // Always navigate to login page from any step
        router.push('/login');
    };

    const handleRequestReset = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSubmitting(true);

        const emailValidationError = validateEmail(email);
        if (emailValidationError) {
            setEmailError(emailValidationError);
            setIsSubmitting(false);
            return;
        }

        setEmailError('');

        try {
            const result = await apiRequest(`${process.env.NEXT_PUBLIC_API_KEY}/auth/request-reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (result.success) {
                // Redirect to new-password step with email parameter and from=email
                router.push(`/reset-password?email=${encodeURIComponent(email)}&step=new-password&from=email`);
                return; // Don't set isSubmitting to false on success
            } else {
                setError(getErrorMessage(result.error));
            }
        } catch (error) {
            setError('Terjadi kesalahan yang tidak terduga. Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResendOTP = async () => {
        if (countdown > 0) return;

        setError('');
        setSuccess('');
        setIsSubmitting(true);

        try {
            const result = await apiRequest(`${process.env.NEXT_PUBLIC_API_KEY}/auth/request-reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (result.success) {
                // Reset OTP fields and countdown without showing success message
                setCountdown(60);
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            } else {
                setError(getErrorMessage(result.error));
            }
        } catch (error) {
            setError('Terjadi kesalahan yang tidak terduga. Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOTPChange = (index: number, value: string) => {
        const digit = value.replace(/\D/g, '');

        if (digit.length > 1) {
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);

        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOTPKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleOTPPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newOtp = [...otp];

        for (let i = 0; i < pastedData.length; i++) {
            newOtp[i] = pastedData[i];
        }

        setOtp(newOtp);

        const nextIndex = Math.min(pastedData.length, 5);
        inputRefs.current[nextIndex]?.focus();
    };


    const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setHasSubmitted(true);

        if (newPassword !== confirmPassword) {
            setError('Password dan konfirmasi password tidak cocok.');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password harus minimal 8 karakter.');
            return;
        }

        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
            setError('Password harus mengandung huruf kecil, huruf besar, dan angka.');
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await apiRequest(`${process.env.NEXT_PUBLIC_API_KEY}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    otp: otp.join(''),
                    newPassword,
                }),
            });

            if (result.success) {
                setSuccess('Password berhasil direset. Silakan login dengan password baru Anda.');
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
            } else {
                // Use custom error message handler for OTP errors in reset password
                const errorMsg = result.error || 'Unknown error';
                setError(getResetOTPErrorMessage(errorMsg, result.data));
            }
        } catch (error) {
            setError('Terjadi kesalahan yang tidak terduga. Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderEmailStep = () => (
        <div className="w-full max-w-md px-4 sm:px-6 py-6 sm:py-8 bg-background rounded-lg shadow-sm border border-border/10">
            <div className="w-full flex flex-col justify-center">
                <div className="max-w-md mx-auto w-full">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2 text-foreground cursor">Reset Password</h1>
                        <p className="text-sm text-muted-foreground">
                            Masukkan alamat email Anda dan kami akan mengirimkan kode verifikasi terhadap alamat email Anda untuk mereset password pada akun Anda.
                        </p>
                        {error && (
                            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}
                        {success && (
                            <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
                                <p className="text-sm text-green-600">{success}</p>
                            </div>
                        )}
                    </div>

                    <form className="space-y-4" onSubmit={handleRequestReset}>
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-foreground">Alamat Email</label>
                            <Input
                                id="email"
                                type="text"
                                placeholder="nama@email.com"
                                autoComplete="email"
                                value={email}
                                onChange={handleEmailChange}
                                disabled={isSubmitting || !!success}
                                className={emailError ? 'border-red-500 focus:border-red-500' : ''}
                            />
                            {emailError && <p className="text-sm text-red-600">{emailError}</p>}
                        </div>

                        <Button
                            type="submit"
                            className="w-full font-medium cursor-pointer"
                            disabled={isSubmitting || !email || !!success}
                        >
                            {isSubmitting ? (
                                <svg
                                    className="animate-spin h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                            ) : (
                                'Kirim Kode Verifikasi'
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );


    const renderNewPasswordStep = () => (
        <div className="w-full max-w-md px-4 sm:px-6 py-6 sm:py-8 bg-background rounded-lg shadow-sm border border-border/10">
            <div className="w-full flex flex-col justify-center">
                <div className="max-w-md mx-auto w-full">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2 text-foreground">Reset Password</h1>
                        <p className="text-sm text-muted-foreground mb-2">
                            Masukkan kode OTP yang telah dikirim ke email{" "}
                            <span className="font-medium text-primary">{email}</span> dan password baru Anda.
                        </p>
                        {error && (
                            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}
                        {success && (
                            <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
                                <p className="text-sm text-green-600">{success}</p>
                            </div>
                        )}
                    </div>

                    <form className="space-y-4" onSubmit={handleResetPassword}>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-foreground">Kode OTP</label>
                            <div className="flex gap-2 justify-center">
                                {otp.map((digit, index) => (
                                    <Input
                                        key={index}
                                        ref={(el) => { inputRefs.current[index] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOTPChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOTPKeyDown(index, e)}
                                        onPaste={handleOTPPaste}
                                        disabled={isSubmitting}
                                        className="w-12 h-12 text-center text-xl font-semibold"
                                        autoComplete="one-time-code"
                                    />
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                                Masukkan 6 digit kode yang dikirim ke email Anda
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="new-password" className="block text-sm font-medium text-foreground">Kata Sandi Baru</label>
                            <div className="relative">
                                <Input
                                    id="new-password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Masukkan kata sandi baru"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? (
                                        <svg className="h-5 w-5 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <div className="text-xs space-y-1 mt-2">
                                <div className={`flex items-center gap-2 transition-all duration-300 ${(!newPassword && !hasSubmitted) ? 'text-gray-500' :
                                        newPassword.length >= 8 ? 'text-green-600' : 'text-red-500'
                                    }`}>
                                    {newPassword.length >= 8 ? (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    <span>Minimal 8 karakter</span>
                                </div>
                                <div className={`flex items-center gap-2 transition-all duration-300 ${(!newPassword && !hasSubmitted) ? 'text-gray-500' :
                                        /[a-z]/.test(newPassword) ? 'text-green-600' : 'text-red-500'
                                    }`}>
                                    {/[a-z]/.test(newPassword) ? (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    <span>Mengandung huruf kecil</span>
                                </div>
                                <div className={`flex items-center gap-2 transition-all duration-300 ${(!newPassword && !hasSubmitted) ? 'text-gray-500' :
                                        /[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-red-500'
                                    }`}>
                                    {/[A-Z]/.test(newPassword) ? (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    <span>Mengandung huruf besar</span>
                                </div>
                                <div className={`flex items-center gap-2 transition-all duration-300 ${(!newPassword && !hasSubmitted) ? 'text-gray-500' :
                                        /\d/.test(newPassword) ? 'text-green-600' : 'text-red-500'
                                    }`}>
                                    {/\d/.test(newPassword) ? (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    <span>Mengandung angka</span>
                                </div>
                                <div className={`flex items-center gap-2 transition-all duration-300 ${(!newPassword && !hasSubmitted) ? 'text-gray-500' :
                                        /[\W_]/.test(newPassword) ? 'text-green-600' : 'text-red-500'
                                    }`}>
                                    {/[\W_]/.test(newPassword) ? (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    <span>Mengandung karakter spesial</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground">Konfirmasi Kata Sandi Baru</label>
                            <div className="relative">
                                <Input
                                    id="confirm-password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Konfirmasi kata sandi baru"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? (
                                        <svg className="h-5 w-5 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full font-medium cursor-pointer"
                            disabled={isSubmitting || !newPassword || !confirmPassword || !!success}
                        >
                            {isSubmitting ? (
                                <svg
                                    className="animate-spin h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                            ) : (
                                'Reset Password'
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background relative px-4 py-6">
            <div className="w-full max-w-md flex justify-start mb-4">
                <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="flex items-center text-foreground hover:bg-muted/50 cursor-pointer"
                    size="sm"
                    disabled={isSubmitting || !!success}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Kembali
                </Button>
            </div>

            {step === 'email' && renderEmailStep()}
            {step === 'new-password' && renderNewPasswordStep()}

            <div className="mt-6 sm:mt-8 text-center text-xs text-muted-foreground px-4">
                © 2025 PT Vibing Global Media. All Rights Reserved
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
