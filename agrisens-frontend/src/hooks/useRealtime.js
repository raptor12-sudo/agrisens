import { useState, useCallback } from 'react';
import { usePolling } from './usePolling';

export function useRealtime(fetchFn, intervalMs = 15000) {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const load = useCallback(async () => {
    try {
      const result = await fetchFn();
      setData(result);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  usePolling(load, intervalMs, []);

  return { data, loading, error, lastUpdate, refresh: load };
}
