import { useEffect, useRef } from 'react';
import { Input } from '@/lib/engine/Input';

/**
 * Hook to manage input state
 */
export function useInput(): React.MutableRefObject<Input | null> {
  const inputRef = useRef<Input | null>(null);

  useEffect(() => {
    if (!inputRef.current) {
      inputRef.current = new Input();
    }

    return () => {
      inputRef.current?.dispose();
    };
  }, []);

  return inputRef;
}
