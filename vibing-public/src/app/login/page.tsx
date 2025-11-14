'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FcGoogle } from 'react-icons/fc';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { apiRequest, getErrorMessage } from '@/utils/globalErrorHandler';

export default function LoginPage() {
  const router = useRouter();
  const { isLoggedIn, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isLoggedIn) {
      router.push('/');
    }
  }, [isLoggedIn, router]);

  if (isLoggedIn) {
    return null;
  }

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      const result = await login(email, password, rememberMe);

      if (result.success) {
        setSuccess('Login berhasil! Anda akan dialihkan ke halaman utama.');
        
        setTimeout(() => {
          router.push('/');
        }, 2000);
        return;
      } else {
        setError(getErrorMessage(result.message));
        setIsSubmitting(false);
      }
    } catch (error: any) {
      setError('Terjadi kesalahan yang tidak terduga.');
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/');
  };

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
              <h1 className="text-3xl font-bold mb-2 text-foreground">Selamat datang kembali</h1>
              {success && (
                <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}
              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-foreground">Alamat Email</label>
                <Input
                  id="email"
                  type="text"
                  placeholder="nama@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={handleEmailChange}
                  disabled={isSubmitting}
                  className={emailError ? 'border-red-500 focus:border-red-500' : ''}
                />
                {emailError && <p className="text-sm text-red-600">{emailError}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="block text-sm font-medium text-foreground">Kata Sandi</label>
                  <Link
                    href="/reset-password"
                    className={`text-sm transition-colors ${isSubmitting
                        ? 'text-muted-foreground cursor-not-allowed pointer-events-none'
                        : 'text-primary hover:underline hover:text-primary/90 cursor-pointer'
                      }`}
                  >
                    Lupa kata sandi?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                    className={`absolute inset-y-0 right-0 pr-3 flex items-center transition-colors ${isSubmitting
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-400 hover:text-gray-600 cursor-pointer'
                      }`}
                  >
                    {showPassword ? (
                      <svg className={`h-5 w-5 ${isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className={`h-5 w-5 ${isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <label
                  htmlFor="remember"
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isSubmitting}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center ${isSubmitting
                        ? 'cursor-not-allowed border-gray-300 bg-gray-100'
                        : rememberMe
                          ? 'cursor-pointer border-primary bg-primary hover:border-primary/80 hover:bg-primary/90'
                          : 'cursor-pointer border-gray-300 bg-white hover:border-primary/50'
                      }`}
                  >
                    {rememberMe && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`text-sm select-none transition-colors ${isSubmitting
                        ? 'text-muted-foreground cursor-not-allowed'
                        : 'text-foreground hover:text-primary'
                      }`}
                  >
                    Ingatkan saya
                  </span>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full font-medium cursor-pointer"
                disabled={isSubmitting || !email || !password}
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
                  'Masuk'
                )}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Atau lanjutkan dengan</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full hover:bg-muted/50 transition-colors cursor-pointer"
                disabled={isSubmitting}
              >
                <FcGoogle className="mr-2 h-5 w-5" />
                Masuk dengan Google
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-foreground">
              Belum punya akun?{" "}
              <Button
                variant="link"
                onClick={() => router.push('/register')}
                disabled={isSubmitting}
                className="text-primary hover:underline hover:text-primary/90 transition-colors font-medium p-0 h-auto cursor-pointer"
              >
                Daftar
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
