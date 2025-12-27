// @ts-nocheck
import { useEffect, useState } from 'react';
import { apiClientFetch } from '../api';

export function useIntegrations() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    apiClientFetch('/api/integrations')
      .then((res) => setItems(res?.data ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return { items, loading, error, reload: load };
}
