'use client';

import {useState, useEffect} from 'react';
import {Font} from '../types';

interface UseFontsReturn {
    fonts: Font[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage fonts data
 */
export const useFonts = (): UseFontsReturn => {
    const [fonts, setFonts] = useState<Font[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFonts = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/fonts');

            if (!response.ok) {
                throw new Error(`Error fetching fonts: ${response.statusText}`);
            }

            const data = await response.json();
            setFonts(data);
        } catch (err) {
            console.error('Failed to fetch fonts:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Load fonts on component mount
    useEffect(() => {
        fetchFonts();
    }, []);

    return {
        fonts,
        loading,
        error,
        refetch: fetchFonts
    };
};

export default useFonts;
