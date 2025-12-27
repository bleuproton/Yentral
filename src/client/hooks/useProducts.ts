// @ts-nocheck
import { useEffect, useState } from 'react';
import { apiClientFetch } from '../api';

export function useProducts() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiClientFetch('/api/products')
      .then((res) => mounted && setItems(res?.data ?? []))
      .catch((err) => mounted && setError(err.message))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return { items, loading, error };
}
