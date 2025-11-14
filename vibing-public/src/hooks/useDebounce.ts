import { useState, useEffect } from 'react';

/**
 * Custom hook untuk debouncing nilai input
 * @param value - Nilai yang akan di-debounce
 * @param delay - Delay dalam milliseconds (default: 500ms)
 * @returns Nilai yang sudah di-debounce
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Set timeout untuk update debounced value
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Cleanup timeout jika value berubah sebelum delay selesai
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
