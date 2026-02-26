import { useState, useEffect } from "react";

/**
 * Debounces a value by the specified delay.
 * The input updates instantly (for responsive typing),
 * but the returned debounced value only updates after the delay.
 */
export function useDebounce<T>(value: T, delay: number = 200): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}
