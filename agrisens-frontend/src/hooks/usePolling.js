import { useEffect, useRef } from 'react';

export function usePolling(fn, intervalMs = 10000, deps = []) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    fnRef.current();
    const id = setInterval(() => fnRef.current(), intervalMs);
    return () => clearInterval(id);
  }, deps);
}
