'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/utils/globalErrorHandler';
import NotFound from '../not-found';

const getOTPErrorMessage = (errorMessage: string, backendData?: any): string => {
    if (errorMessage === 'Invalid OTP') {
        if (backendData && backendData.remainingAttempts !== undefined) {
            const remainingAttempts = backendData.remainingAttempts;

            if (remainingAttempts > 1) {
                return `Kode OTP yang Anda masukkan salah. Anda memiliki ${remainingAttempts} percobaan lagi.`;
            } else if (remainingAttempts === 1) {
                return 'Kode OTP yang Anda masukkan salah. Anda memiliki 1 percobaan terakhir.';
            } else if (remainingAttempts === 0) {
                return 'Anda telah memasukkan kode OTP yang salah terlalu banyak. Silakan coba lagi dalam 5 menit.';
            }
        }
        return 'Kode OTP yang Anda masukkan salah. Silakan periksa kembali dan coba lagi.';
    }

    if (errorMessage.includes('Too many invalid OTP attempts')) {
        const match = errorMessage.match(/Try again in (\d+) minute\(s\)/);
        const minutes = match ? match[1] : '5';
        return `Anda telah memasukkan kode OTP yang salah terlalu banyak. Silakan coba lagi dalam ${minutes} menit.`;
    }

    if (errorMessage === 'Too many OTP requests. Try again later') {
        return 'Anda telah mencapai batas maksimal pengiriman ulang OTP. Silakan coba lagi nanti.';
    }

    if (errorMessage.includes('Wait') && errorMessage.includes('seconds before sending another OTP')) {
        const match = errorMessage.match(/Wait (\d+) seconds/);
        const seconds = match ? match[1] : '60';
        return `Tunggu ${seconds} detik sebelum mengirim ulang OTP.`;
    }

    if (errorMessage === 'OTP expired. Please request OTP again') {
        return 'Kode OTP telah kedaluwarsa. Silakan minta kode OTP baru.';
    }

    if (errorMessage === 'Account is already activated') {
        return 'Akun Anda sudah aktif. Silakan login.';
    }

    if (errorMessage === 'No active OTP. Please request OTP again') {
        return 'Tidak ada kode OTP yang aktif. Silakan minta kode OTP baru.';
    }

    return 'Terjadi kesalahan. Silakan periksa kembali dan coba lagi.';
};

function VerifyOTPContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isLoggedIn } = useAuth();
    const [email, setEmail] = useState<string>('');
    const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [countdown, setCountdown] = useState<number>(0);
    const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(true);
    const [maxAttempts] = useState<number>(3);
    const [isLocked, setIsLocked] = useState<boolean>(false);
    const [lockCountdown, setLockCountdown] = useState<number>(0);
    const [attemptCount, setAttemptCount] = useState<number>(0);
    const [isVerified, setIsVerified] = useState<boolean>(false);
    const [showNotFound, setShowNotFound] = useState<boolean>(false);
    const [isAlreadyVerified, setIsAlreadyVerified] = useState<boolean>(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const checkVerificationStatus = async (email: string) => {
        try {
            const result = await apiRequest(`${process.env.NEXT_PUBLIC_API_KEY}/auth/check-verification-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (result.success) {
                if (result.data?.isVerified === true) {
                    setIsAlreadyVerified(true);
                    return true;
                } else {
                    return false;
                }
            } else {
                setShowNotFound(true);
                setIsCheckingStatus(false);
                return true;
            }
        } catch (error) {
            return false;
        }
    };

    const checkLockStatus = async (email: string) => {
        try {
            const result = await apiRequest(`${process.env.NEXT_PUBLIC_API_KEY}/auth/check-lock-status`, {
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
                    setLockCountdown(lockData.remainingSeconds || (lockData.remainingMinutes * 60));

                    if (lockData.lockType === 'otp_verify') {
                        const minutes = Math.ceil((lockData.remainingSeconds || 0) / 60);
                        setError(`Anda telah memasukkan kode OTP yang salah terlalu banyak. Silakan coba lagi dalam ${minutes} menit.`);
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
        const fromRegister = searchParams.get('from');

        if (emailParam) {
            let decodedEmail;

            try {
                decodedEmail = decodeURIComponent(emailParam);
            } catch (error) {
                setShowNotFound(true);
                setIsCheckingStatus(false);
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(decodedEmail)) {
                setShowNotFound(true);
                setIsCheckingStatus(false);
                return;
            }

            setEmail(decodedEmail);
            setIsCheckingStatus(true);

            checkVerificationStatus(decodedEmail).then((shouldBlock) => {
                if (shouldBlock) {
                    setIsCheckingStatus(false);
                    return;
                }

                checkLockStatus(decodedEmail).then((isUserLocked) => {
                    setIsCheckingStatus(false);

                    const messageShownKey = `otp_message_shown_${decodedEmail}`;
                    const messageAlreadyShown = sessionStorage.getItem(messageShownKey);

                    if (!isUserLocked && fromRegister === 'register' && !messageAlreadyShown) {
                        setSuccess('Kode OTP telah dikirim ke email Anda. Silakan periksa kotak masuk Anda.');
                        setCountdown(60);

                        sessionStorage.setItem(messageShownKey, 'true');

                        const newUrl = new URL(window.location.href);
                        newUrl.searchParams.delete('from');
                        window.history.replaceState({}, '', newUrl.toString());
                    }
                });
            });
        } else {
            setShowNotFound(true);
            setIsCheckingStatus(false);
        }
    }, [searchParams]);

    useEffect(() => {
        if (isLoggedIn) {
            router.push('/');
        }
    }, [isLoggedIn, router]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
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

    if (isLoggedIn) {
        return null;
    }

    const handleVerifyOTP = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (isLocked) {
            return;
        }

        setError('');
        setSuccess('');
        setIsSubmitting(true);

        const otpValue = otp.join('');

        if (!email || !otpValue) {
            setError('Email dan OTP diperlukan');
            setIsSubmitting(false);
            return;
        }

        if (otpValue.length !== 6) {
            setError('OTP harus 6 digit');
            setIsSubmitting(false);
            return;
        }

        try {
            const result = await apiRequest(`${process.env.NEXT_PUBLIC_API_KEY}/auth/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    otp: otpValue
                }),
            });

            if (result.success) {
                setSuccess('Verifikasi berhasil! Sedang mengarahkan Anda ke halaman Login...');
                setIsVerified(true);

                const messageShownKey = `otp_message_shown_${email}`;
                sessionStorage.removeItem(messageShownKey);

                setTimeout(() => {
                    router.push('/login');
                }, 2000);
                return;
            } else {
                const errorMsg = result.error || 'Unknown error';

                if (errorMsg.includes('Too many invalid OTP attempts')) {
                    const match = errorMsg.match(/Try again in (\d+) minute\(s\)/);
                    const remainingMinutes = match ? parseInt(match[1]) : 5;
                    setIsLocked(true);
                    setLockCountdown(remainingMinutes * 60);
                    setError(`Anda telah memasukkan kode OTP yang salah terlalu banyak. Silakan coba lagi dalam ${remainingMinutes} menit.`);
                } else if (errorMsg === 'OTP expired. Please request OTP again') {
                    setError(getOTPErrorMessage(errorMsg));
                } else if (errorMsg === 'No active OTP. Please request OTP again') {
                    setError(getOTPErrorMessage(errorMsg));
                } else if (errorMsg === 'Account is already activated') {
                    setError(getOTPErrorMessage(errorMsg));
                } else if (errorMsg === 'Invalid OTP') {
                    if (result.data && result.data.attemptCount !== undefined) {
                        const currentAttempts = result.data.attemptCount;
                        const remainingAttempts = result.data.remainingAttempts;

                        setAttemptCount(currentAttempts);

                        if (remainingAttempts === 0) {
                            setIsLocked(true);
                            setLockCountdown(5 * 60);
                            setError('Anda telah memasukkan kode OTP yang salah terlalu banyak. Silakan coba lagi dalam 5 menit.');
                        } else {
                            setError(getOTPErrorMessage(errorMsg, result.data));
                        }
                    } else {
                        const newAttemptCount = attemptCount + 1;
                        setAttemptCount(newAttemptCount);

                        if (newAttemptCount >= maxAttempts) {
                            setIsLocked(true);
                            setLockCountdown(5 * 60);
                            setError('Anda telah memasukkan kode OTP yang salah terlalu banyak. Silakan coba lagi dalam 5 menit.');
                        } else {
                            setError(getOTPErrorMessage(errorMsg, { remainingAttempts: maxAttempts - newAttemptCount }));
                        }
                    }
                } else {
                    setError(getOTPErrorMessage(errorMsg));
                }
                setIsSubmitting(false);
            }
        } catch (error) {
            setError('Terjadi kesalahan yang tidak terduga.');
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
            const result = await apiRequest(`${process.env.NEXT_PUBLIC_API_KEY}/auth/resend-otp`, {
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
                setError(getOTPErrorMessage(result.error || 'Unknown error'));
            }
        } catch (error) {
            setError('Terjadi kesalahan yang tidak terduga. Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        router.push('/register');
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

    if (isCheckingStatus) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background relative px-4 py-6">
                <div className="w-full max-w-md px-4 sm:px-6 py-6 sm:py-8 bg-background rounded-lg shadow-sm border border-border/10">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <svg
                            className="animate-spin h-8 w-8 text-primary"
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
                        <p className="text-sm text-muted-foreground">Memeriksa status verifikasi...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (showNotFound || isAlreadyVerified) {
        return <NotFound />;
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background relative px-4 py-6">
            <div className="w-full max-w-md flex justify-start mb-4">
                <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="flex items-center text-foreground hover:bg-muted/50 cursor-pointer"
                    size="sm"
                    disabled={isSubmitting}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Kembali
                </Button>
            </div>

            <div className="w-full max-w-md px-4 sm:px-6 py-6 sm:py-8 bg-background rounded-lg shadow-sm border border-border/10">
                <div className="w-full flex flex-col justify-center">
                    <div className="max-w-md mx-auto w-full">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold mb-2 text-foreground">Verifikasi Email</h1>
                            <p className="text-sm text-muted-foreground mb-2">
                                Kami telah mengirimkan kode OTP 6 digit ke email{" "}
                                <span className="font-medium text-primary">{email}</span>. Silakan masukkan kode tersebut untuk mengaktifkan akun Anda.
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

                        <form className="space-y-6" onSubmit={handleVerifyOTP}>
                            <label className="block text-sm font-medium text-foreground">Email</label>
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                <p className="text-sm text-yellow-800">{email}</p>
                            </div>

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
                                        disabled={isSubmitting || isVerified || isLocked}
                                        className="w-12 h-12 text-center text-xl font-semibold"
                                        autoComplete="one-time-code"
                                    />
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                                Masukkan 6 digit kode yang dikirim ke email Anda
                            </p>

                            <Button
                                type="submit"
                                className="w-full font-medium cursor-pointer"
                                disabled={isSubmitting || otp.join('').length !== 6 || isVerified || isLocked}
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
                                    'Verifikasi'
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
                                disabled={countdown > 0 || isSubmitting || isVerified}
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

            <div className="mt-6 sm:mt-8 text-center text-xs text-muted-foreground px-4">
                © 2025 PT Vibing Global Media. All Rights Reserved
            </div>
        </div>
    );
}

export default function VerifyOTPPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyOTPContent />
        </Suspense>
    );
}
