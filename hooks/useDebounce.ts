import { useState, useEffect } from "react";

/**
 * A hook that delays the update of a value until after a specified delay
 * has passed since the last time the value was updated.
 * 
 * Useful for preventing excessive re-renders or API calls during rapid 
 * user input (like search bars).
 * 
 * @param value The value to debounce
 * @param delay Delay in milliseconds (default 500)
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set debouncedValue to value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the timeout if value changes (also on component unmount)
    // This is the core "debounce" mechanism.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
