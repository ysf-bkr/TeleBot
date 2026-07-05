import { useState, useCallback } from 'react';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (err: any) => void;
}

export function useApi<T = any>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (promise: Promise<{ data: T }>, options?: UseApiOptions<T>) => {
      setLoading(true);
      setError(null);
      try {
        const res = await promise;
        setData(res.data);
        options?.onSuccess?.(res.data);
        return res.data;
      } catch (err: any) {
        const msg = err?.response?.data?.error || err.message || 'İstek başarısız';
        setError(msg);
        options?.onError?.(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = () => {
    setData(null);
    setError(null);
    setLoading(false);
  };

  return { data, loading, error, execute, reset };
}

export default useApi;
