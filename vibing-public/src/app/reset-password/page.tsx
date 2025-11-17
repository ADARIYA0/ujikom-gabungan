'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef, Suspense } from 'react';
import { apiRequest, getErrorMessage } from '@/utils/globalErrorHandler';

type ResetStep = 'email' | 'verify-otp' | 'new-password';

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
            return `Anda telah memasukkan kode OTP yang salah terlalu banyak. Silakan coba lagi dalam beberapa menit.`;
        }
        return 'Anda telah memasukkan kode OTP yang salah terlalu banyak. Silakan coba lagi nanti.';
    }
    
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
    const [isLocked, setIsLocked] = useState(false);
    const [lockCountdown, setLockCountdown] = useState(0);
    const [attemptCount, setAttemptCount] = useState(0);
    const [maxAttempts] = useState(3);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const checkPasswordResetRequestStatus = async (email: string) => {
        try {
            const result = await apiRequest(`${process.env.NEXT_PUBLIC_API_KEY}/auth/check-password-reset-request-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (result.success && result.data) {
                return result.data.hasActiveRequest;
            }

            return false;
        } catch (error) {
            return false;
        }
    };

    const checkPasswordResetLockStatus = async (email: string) => {
        try {
            const result = await apiRequest(`${process.env.NEXT_PUBLIC_API_KEY}/auth/check-password-reset-lock-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (result.success && result.data) {
                const lockData = result.data;

                if (lockData.isLocked) {
                    setIsLocked(true);
                    setLockCountdown(lockData.remainingSeconds || 0);

                    if (lockData.lockType === 'password_reset_verify') {
                        setError(`Anda telah memasukkan kode OTP yang salah terlalu banyak. Silakan coba lagi dalam beberapa menit.`);
                        setAttemptCount(3);
                    }

                    return true;
                } else {
                    setAttemptCount(lockData.attemptCount || 0);
                    return false;
                }
            }

            return false;
        } catch (error) {
            return false;
        }
    };

    useEffect(() => {
        const emailParam = searchParams.get('email');
        const stepParam = searchParams.get('step');
        const fromEmail = searchParams.get('from');
        
        if (emailParam) {
            const decodedEmail = decodeURIComponent(emailParam);
            setEmail(decodedEmail);
            
            if (stepParam === 'verify-otp') {
                checkPasswordResetRequestStatus(decodedEmail).then((hasActiveRequest) => {
                    if (!hasActiveRequest) {
                        setIsValidAccess(false);
                        return;
                    }
                    
                    setIsValidAccess(true);
                    setStep(stepParam);
                    
                    checkPasswordResetLockStatus(decodedEmail).then((isUserLocked) => {
                        if (!isUserLocked) {
                            if (fromEmail === 'email') {
                                setSuccess('Kode OTP telah dikirim ke email Anda. Silakan periksa kotak masuk Anda.');
                                setCountdown(60);
                                
                                const newUrl = new URL(window.location.href);
                                newUrl.searchParams.delete('from');
                                window.history.replaceState({}, '', newUrl.toString());
                            } else {
                                const messageShownKey = `reset_message_shown_${decodedEmail}`;
                                const messageAlreadyShown = sessionStorage.getItem(messageShownKey);
                                
                                if (!messageAlreadyShown) {
                                    setSuccess('Kode OTP telah dikirim ke email Anda. Silakan periksa kotak masuk Anda.');
                                    setCountdown(60);
                                    sessionStorage.setItem(messageShownKey, 'true');
                                }
                            }
                        }
                    });
                });
            } else if (stepParam === 'new-password') {
                checkPasswordResetRequestStatus(decodedEmail).then((hasActiveRequest) => {
                    if (!hasActiveRequest) {
                        setIsValidAccess(false);
                        return;
                    }
                    
                    setIsValidAccess(true);
                    setStep(stepParam);
                    
                    if (stepParam === 'new-password' && fromEmail === 'verify-otp') {
                        const messageShownKey = `otp_verified_message_shown_${decodedEmail}`;
                        const messageAlreadyShown = sessionStorage.getItem(messageShownKey);
                        
                        if (!messageAlreadyShown) {
                            setSuccess('Kode OTP berhasil diverifikasi! Silakan masukkan password baru Anda.');
                            
                            sessionStorage.setItem(messageShownKey, 'true');
                            const newUrl = new URL(window.location.href);
                            newUrl.searchParams.delete('from');
                            window.history.replaceState({}, '', newUrl.toString());
                        }
                    }
                });
            } else {
                setStep('verify-otp'); 
            }
        } else {
            setStep('email'); 
        }
    }, [searchParams]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (lockCountdown > 0) {
            timer = setTimeout(() => {
                setLockCountdown(lockCountdown - 1);
                if (lockCountdown === 1) {
                    setIsLocked(false);
                    setAttemptCount(0);
                    setError('');
                    setSuccess('Akun Anda sudah dapat digunakan kembali. Silakan coba verifikasi lagi.');
                }
            }, 1000);
        }
        return () => clearTimeout(timer);
    }, [lockCountdown]);

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
        setError('');
        setSuccess('');

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
                router.push(`/reset-password?email=${encodeURIComponent(email)}&step=verify-otp&from=email`);
                return;
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

        if (!isLocked) {
            setError('');
        }
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
                setSuccess('Kode OTP baru telah dikirim ke email Anda.');
                setCountdown(60);
                setOtp(['', '', '', '', '', '']);
                if (!isLocked) {
                    setAttemptCount(0);
                    inputRefs.current[0]?.focus();
                }
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

    const handleVerifyOTP = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (isLocked) {
            return;
        }

        setError('');
        setSuccess('');
        setIsSubmitting(true);

        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Silakan masukkan kode OTP 6 digit.');
            setIsSubmitting(false);
            return;
        }

        try {
            const result = await apiRequest(`${process.env.NEXT_PUBLIC_API_KEY}/auth/verify-password-reset-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    otp: otpString,
                }),
            });

            if (result.success) {
                router.push(`/reset-password?email=${encodeURIComponent(email)}&step=new-password&from=verify-otp`);
                return;
            } else {
                const errorMsg = result.error || 'Unknown error';
                
                if (errorMsg.includes('Too many invalid OTP attempts')) {
                    const match = errorMsg.match(/Try again in (\d+) minute\(s\)/);
                    const remainingMinutes = match ? parseInt(match[1]) : 5;
                    const totalSeconds = remainingMinutes * 60;
                    setIsLocked(true);
                    setLockCountdown(totalSeconds);
                    
                    setError(`Anda telah memasukkan kode OTP yang salah terlalu banyak. Silakan coba lagi dalam beberapa menit.`);
                } else if (errorMsg === 'Invalid OTP') {
                    if (result.data && result.data.attemptCount !== undefined) {
                        const currentAttempts = result.data.attemptCount;
                        const remainingAttempts = result.data.remainingAttempts;

                        setAttemptCount(currentAttempts);

                        if (remainingAttempts === 0) {
                            const totalSeconds = 5 * 60;
                            setIsLocked(true);
                            setLockCountdown(totalSeconds);
                            
                            setError(`Anda telah memasukkan kode OTP yang salah terlalu banyak. Silakan coba lagi dalam beberapa menit.`);
                        } else {
                            setError(getResetOTPErrorMessage(errorMsg, result.data));
                        }
                    } else {
                        const newAttemptCount = attemptCount + 1;
                        setAttemptCount(newAttemptCount);

                        if (newAttemptCount >= maxAttempts) {
                            const totalSeconds = 5 * 60;
                            setIsLocked(true);
                            setLockCountdown(totalSeconds);
                            
                            setError(`Anda telah memasukkan kode OTP yang salah terlalu banyak. Silakan coba lagi dalam beberapa menit.`);
                        } else {
                            setError(getResetOTPErrorMessage(errorMsg, { remainingAttempts: maxAttempts - newAttemptCount }));
                        }
                    }
                } else {
                    setError(getResetOTPErrorMessage(errorMsg, result.data));
                }
            }
        } catch (error) {
            setError('Terjadi kesalahan yang tidak terduga. Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
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
                    newPassword,
                }),
            });

            if (result.success) {
                setSuccess('Password berhasil direset. Silakan login dengan password baru Anda.');
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
            } else {
                const errorMsg = result.error || 'Unknown error';
                setError(getResetOTPErrorMessage(errorMsg, result.data));
            }
        } catch (error) {
            setError('Terjadi kesalahan yang tidak terduga. Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderVerifyOTPStep = () => (
        <div className="w-full max-w-md px-4 sm:px-6 py-6 sm:py-8 bg-background rounded-lg shadow-sm border border-border/10">
            <div className="w-full flex flex-col justify-center">
                <div className="max-w-md mx-auto w-full">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2 text-foreground">Verifikasi OTP</h1>
                        <p className="text-sm text-muted-foreground mb-2">
                            Kami telah mengirimkan kode OTP 6 digit ke email{" "}
                            <span className="font-medium text-primary">{email}</span>. Silakan masukkan kode tersebut untuk melanjutkan proses reset password.
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

                    <form className="space-y-4" onSubmit={handleVerifyOTP}>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-foreground">Email</label>
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                <p className="text-sm text-yellow-800">{email}</p>
                            </div>
                        </div>
                        
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
                                        disabled={isSubmitting || isLocked}
                                        className="w-12 h-12 text-center text-xl font-semibold"
                                        autoComplete="one-time-code"
                                    />
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                                Masukkan 6 digit kode yang dikirim ke email Anda
                            </p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full font-medium cursor-pointer"
                            disabled={isSubmitting || otp.join('').length !== 6 || isLocked}
                        >
                            {isLocked ? (
                                <>
                                    Terkunci ({Math.floor(lockCountdown / 60)}:{(lockCountdown % 60).toString().padStart(2, '0')})
                                </>
                            ) : isSubmitting ? (
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
                                'Verifikasi OTP'
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                            Tidak menerima kode?
                        </p>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleResendOTP}
                            disabled={countdown > 0 || isSubmitting}
                            className="text-primary hover:text-primary/90 disabled:text-muted-foreground disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
                        >
                            {countdown > 0 ?
                                `Kirim ulang OTP (${countdown}s)` :
                                'Kirim ulang OTP'
                            }
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );

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
                        <h1 className="text-3xl font-bold mb-2 text-foreground">Buat Password Baru</h1>
                        <p className="text-sm text-muted-foreground mb-2">
                            Masukkan password baru untuk akun{" "}
                            <span className="font-medium text-primary">{email}</span>.
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

    if (isValidAccess === false) {
        return <NotFound />;
    }

    if (isValidAccess === null && (step === 'verify-otp' || step === 'new-password')) {
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
            {step === 'verify-otp' && renderVerifyOTPStep()}
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
