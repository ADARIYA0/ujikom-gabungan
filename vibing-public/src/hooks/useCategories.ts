/**
 * Custom hook for fetching and managing categories data
 * Compatible with Next.js 15.5.4, React v19.1, TypeScript null-safety
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { categoryService, type Category } from '@/services/categoryService';

export interface UseCategoriesReturn {
    categories: Category[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing categories data
 */
export function useCategories(): UseCategoriesReturn {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCategories = useCallback(async (): Promise<void> => {
        try {
            setIsLoading(true);
            setError(null);

            const fetchedCategories = await categoryService.getCategoriesForHero();

            if (fetchedCategories.length > 0) {
                setCategories(fetchedCategories);
            } else {
                setError('No categories found');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch categories';
            setError(errorMessage);
            console.error('Error in useCategories:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial fetch on mount
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    return {
        categories,
        isLoading,
        error,
        refetch: fetchCategories
    };
}

/**
 * Hook specifically for Hero section categories with optimized loading
 */
export function useCategoriesForHero(): UseCategoriesReturn {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCategoriesForHero = useCallback(async (): Promise<void> => {
        try {
            setIsLoading(true);
            setError(null);

            const fetchedCategories = await categoryService.getCategoriesForHero();
            setCategories(fetchedCategories);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch categories for Hero';
            setError(errorMessage);
            console.error('Error in useCategoriesForHero:', err);

            // Set empty array on error to prevent breaking the UI
            setCategories([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial fetch on mount
    useEffect(() => {
        fetchCategoriesForHero();
    }, [fetchCategoriesForHero]);

    return {
        categories,
        isLoading,
        error,
        refetch: fetchCategoriesForHero
    };
}

export default useCategories;
