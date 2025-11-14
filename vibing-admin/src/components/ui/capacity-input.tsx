'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Users, ChevronUp, ChevronDown } from 'lucide-react';

interface CapacityInputProps {
    id: string;
    name: string;
    value: number;
    onChange: (value: number) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    error?: string;
    isFocused?: boolean;
    min?: number;
}

export default function CapacityInput({
    id,
    name,
    value,
    onChange,
    onFocus,
    onBlur,
    placeholder = "0",
    disabled = false,
    className = "",
    error,
    isFocused = false,
    min = 1
}: CapacityInputProps) {
    const [displayValue, setDisplayValue] = useState<string>('');
    const [internalFocus, setInternalFocus] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Format number with thousand separators
    const formatNumber = (num: number): string => {
        if (num === 0) return '';
        return new Intl.NumberFormat('id-ID').format(num);
    };

    // Parse formatted string back to number
    const parseNumber = (str: string): number => {
        if (!str) return 0;
        const cleanStr = str.replace(/[^\d]/g, '');
        return parseInt(cleanStr) || 0;
    };

    // Update display value when value prop changes
    useEffect(() => {
        if (!internalFocus) {
            setDisplayValue(formatNumber(value));
        }
    }, [value, internalFocus]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        const numericValue = parseNumber(inputValue);

        // Update display with formatted value
        setDisplayValue(formatNumber(numericValue));

        // Call onChange with numeric value
        onChange(numericValue);
    };

    const handleFocus = () => {
        setInternalFocus(true);
        onFocus?.();
    };

    const handleBlur = () => {
        setInternalFocus(false);
        setDisplayValue(formatNumber(value));
        onBlur?.();
    };

    const handleIncrement = () => {
        const newValue = value + 1;
        onChange(newValue);
    };

    const handleDecrement = () => {
        const newValue = Math.max(min, value - 1);
        onChange(newValue);
    };

    const baseClasses = `
    w-full h-11 px-4 pr-20 text-center border rounded-lg transition-all duration-200 ease-in-out
    placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-teal-500/20
  `;

    const stateClasses = error
        ? 'border-red-300 focus:border-red-500'
        : isFocused || internalFocus
            ? 'border-teal-500 bg-teal-50/30'
            : 'border-gray-300 hover:border-gray-400 bg-white';

    return (
        <div className="relative">
            <input
                ref={inputRef}
                id={id}
                name={name}
                type="text"
                value={displayValue}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder}
                disabled={disabled}
                className={`${baseClasses} ${stateClasses} ${className}`}
                autoComplete="off"
            />

            {/* Capacity indicator */}
            <div className="absolute inset-y-0 right-12 flex items-center pointer-events-none">
                <Users className={`h-4 w-4 transition-colors duration-200 ${isFocused || internalFocus ? 'text-teal-600' : 'text-gray-400'
                    }`} />
            </div>

            {/* Custom increment/decrement buttons */}
            <div className="absolute inset-y-0 right-0 flex flex-col">
                <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={disabled}
                    className={`
            flex-1 px-2 rounded-tr-lg border-l border-b-0 transition-all duration-200
            hover:bg-teal-50 active:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-300' : 'border-gray-300'}
            ${isFocused || internalFocus ? 'border-teal-500' : ''}
          `}
                >
                    <ChevronUp className={`h-3 w-3 transition-colors duration-200 ${isFocused || internalFocus ? 'text-teal-600' : 'text-gray-400'
                        }`} />
                </button>
                <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={disabled}
                    className={`
            flex-1 px-2 rounded-br-lg border-l border-t transition-all duration-200
            hover:bg-teal-50 active:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-300' : 'border-gray-300'}
            ${isFocused || internalFocus ? 'border-teal-500' : ''}
          `}
                >
                    <ChevronDown className={`h-3 w-3 transition-colors duration-200 ${isFocused || internalFocus ? 'text-teal-600' : 'text-gray-400'
                        }`} />
                </button>
            </div>
        </div>
    );
}
