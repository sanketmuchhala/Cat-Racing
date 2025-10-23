import { useEffect } from 'react';

/**
 * Hook to handle window resize events
 */
export function useResize(callback: () => void): void {
  useEffect(() => {
    callback();

    const handleResize = () => {
      callback();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [callback]);
}
