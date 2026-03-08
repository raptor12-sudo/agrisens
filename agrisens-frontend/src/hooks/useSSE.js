import { useEffect, useRef, useState } from 'react';

export function useSSE(onLecture, onAlerte) {
  const esRef    = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/sse?token=${token}`;

    // Utiliser fetch avec Authorization header via EventSource polyfill
    // On passe le token en query param pour SSE
    const es = new EventSource(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/sse`,
      { withCredentials: false }
    );

    es.addEventListener('lecture', (e) => {
      try {
        const data = JSON.parse(e.data);
        onLecture && onLecture(data);
      } catch {}
    });

    es.addEventListener('alerte', (e) => {
      try {
        const data = JSON.parse(e.data);
        onAlerte && onAlerte(data);
      } catch {}
    });

    es.onopen  = () => setConnected(true);
    es.onerror = () => setConnected(false);

    esRef.current = es;
    return () => { es.close(); setConnected(false); };
  }, []);

  return { connected };
}
