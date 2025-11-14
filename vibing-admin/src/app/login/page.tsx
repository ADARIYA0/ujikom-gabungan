/**
 * Admin Login Page for PlanHub
 * Matches the design from the provided image with teal theme
 * Compatible with Next.js 15.5.4 and React 19.1
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Background image component - Fixed for SSR
const BackgroundImage = () => (
    <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute top-3/4 left-1/2 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        {/* Mountain silhouette effect */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-teal-900/50 to-transparent"></div>

        {/* Static particles - no random values for SSR compatibility */}
        <div className="absolute inset-0 overflow-hidden">
            <div className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse" style={{ left: '10%', top: '20%', animationDelay: '0s' }} />
            <div className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse" style={{ left: '25%', top: '15%', animationDelay: '0.5s' }} />
            <div className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse" style={{ left: '40%', top: '30%', animationDelay: '1s' }} />
            <div className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse" style={{ left: '60%', top: '25%', animationDelay: '1.5s' }} />
            <div className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse" style={{ left: '75%', top: '35%', animationDelay: '2s' }} />
            <div className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse" style={{ left: '85%', top: '10%', animationDelay: '2.5s' }} />
            <div className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse" style={{ left: '15%', top: '60%', animationDelay: '3s' }} />
            <div className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse" style={{ left: '35%', top: '70%', animationDelay: '0.3s' }} />
            <div className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse" style={{ left: '55%', top: '65%', animationDelay: '0.8s' }} />
            <div className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse" style={{ left: '80%', top: '75%', animationDelay: '1.3s' }} />
        </div>
    </div>
);

// Logo component
const Logo = () => (
    <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-teal-600 rounded-sm"></div>
        </div>
        <span className="text-white text-xl font-bold">PlanHub</span>
    </div>
);

// Input component with teal theme
interface InputProps {
    id: string;
    name: string;
    type: string;
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
    disabled?: boolean;
    error?: string;
}

const Input: React.FC<InputProps> = ({
    id,
    name,
    type,
    placeholder,
    value,
    onChange,
    required = false,
    disabled = false,
    error
}) => (
    <div className="space-y-1">
        <input
            id={id}
            name={name}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className={`
        w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg
        text-white placeholder-gray-400
        focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        ${error ? 'border-red-500 focus:ring-red-500' : ''}
      `}
        />
        {error && (
            <p className="text-red-400 text-sm mt-1">{error}</p>
        )}
    </div>
);

// Password input with toggle visibility
interface PasswordInputProps extends Omit<InputProps, 'type'> {
    showPassword: boolean;
    onTogglePassword: () => void;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
    showPassword,
    onTogglePassword,
    ...props
}) => (
    <div className="relative">
        <Input
            {...props}
            type={showPassword ? 'text' : 'password'}
        />
        <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
            disabled={props.disabled}
        >
            {showPassword ? (
                <EyeOff className="h-5 w-5" />
            ) : (
                <Eye className="h-5 w-5" />
            )}
        </button>
    </div>
);

// Main login page component
export default function LoginPage() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});

    const { login, isAuthenticated } = useAuth();
    const router = useRouter();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            router.push('/');
        }
    }, [isAuthenticated, router]);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Reset errors
        setError('');
        setFieldErrors({});

        // Validation
        const errors: { identifier?: string; password?: string } = {};

        if (!identifier.trim()) {
            errors.identifier = 'Email atau username harus diisi';
        }

        if (!password) {
            errors.password = 'Password harus diisi';
        } else if (password.length < 6) {
            errors.password = 'Password minimal 6 karakter';
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setIsLoading(true);

        try {
            await login(identifier.trim(), password);
            // Redirect will be handled by AuthContext
        } catch (error) {
            console.error('Login error:', error);

            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('Terjadi kesalahan saat login. Silakan coba lagi.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Handle input changes
    const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIdentifier(e.target.value);
        if (fieldErrors.identifier) {
            setFieldErrors(prev => ({ ...prev, identifier: undefined }));
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        if (fieldErrors.password) {
            setFieldErrors(prev => ({ ...prev, password: undefined }));
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left side - Background with branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <BackgroundImage />

                {/* Content overlay */}
                <div className="relative z-10 flex flex-col justify-between p-12 text-white">
                    <Logo />

                    <div className="space-y-6">
                        <h1 className="text-4xl font-bold leading-tight">
                            Kelola Event Anda
                            <br />
                            dengan Mudah
                        </h1>
                        <p className="text-teal-100 text-lg leading-relaxed">
                            Platform admin yang powerful untuk mengelola semua event dan aktivitas
                            di PlanHub dengan efisien dan profesional.
                        </p>
                    </div>

                    {/* Pagination dots */}
                    <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                        <div className="w-6 h-2 bg-white rounded-full"></div>
                    </div>
                </div>
            </div>

            {/* Right side - Login form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-900">
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile logo */}
                    <div className="lg:hidden">
                        <Logo />
                    </div>

                    {/* Form header */}
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-white mb-2">
                            Masuk ke Admin Panel
                        </h2>
                        <p className="text-gray-400">
                            Masukkan kredensial admin Anda untuk mengakses dashboard
                        </p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Login form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <Input
                                id="identifier"
                                name="identifier"
                                type="text"
                                placeholder="Email atau Username"
                                value={identifier}
                                onChange={handleIdentifierChange}
                                required
                                disabled={isLoading}
                                error={fieldErrors.identifier}
                            />

                            <PasswordInput
                                id="password"
                                name="password"
                                placeholder="Password"
                                value={password}
                                onChange={handlePasswordChange}
                                showPassword={showPassword}
                                onTogglePassword={() => setShowPassword(!showPassword)}
                                required
                                disabled={isLoading}
                                error={fieldErrors.password}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`
                w-full flex items-center justify-center gap-2 px-6 py-3
                bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg
                focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-900
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
                ${isLoading ? 'animate-pulse' : ''}
              `}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    Masuk
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="text-center text-gray-500 text-sm">
                        <p>© 2025 PT PlanHub Kreatif Nusantara. All Rights Reserved</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
