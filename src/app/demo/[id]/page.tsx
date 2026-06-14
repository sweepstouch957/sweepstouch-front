'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { demoService, type DemoDetail } from '@/services/demo.service';

export default function DemoViewPage() {
  const { id } = useParams<{ id: string }>();
  const [demo, setDemo] = useState<DemoDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tracked = useRef(false);

  useEffect(() => {
    if (!id) return;
    demoService
      .getPublic(id)
      .then((d) => {
        setDemo(d);
        if (!tracked.current) {
          tracked.current = true;
          demoService.trackView(id);
        }
      })
      .catch((e) => setError(e.message ?? 'Error al cargar el demo'));
  }, [id]);

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#f8f9fa',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <p style={{ fontSize: 48 }}>🔗</p>
        <p style={{ fontWeight: 700, fontSize: 18, color: '#404040' }}>Demo no encontrado</p>
        <p style={{ color: '#999', fontSize: 14 }}>{error}</p>
      </div>
    );
  }

  if (!demo) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16,
          fontFamily: 'system-ui, sans-serif',
          background: '#fff',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '3px solid #f0f0f0',
            borderTopColor: '#ef0f82',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#999', fontSize: 14 }}>Cargando demo…</p>
      </div>
    );
  }

  if (demo.status === 'generating') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16,
          fontFamily: 'system-ui, sans-serif',
          background: '#fff',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '3px solid #f0f0f0',
            borderTopColor: '#ef0f82',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontWeight: 700, color: '#404040' }}>Generando demo "{demo.name}"…</p>
        <p style={{ color: '#999', fontSize: 13 }}>Esto puede tardar unos segundos.</p>
      </div>
    );
  }

  if (demo.status === 'error') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 12,
          fontFamily: 'system-ui, sans-serif',
          background: '#f8f9fa',
        }}
      >
        <p style={{ fontSize: 48 }}>⚠️</p>
        <p style={{ fontWeight: 700, fontSize: 18, color: '#404040' }}>Error al generar el demo</p>
        <p style={{ color: '#999', fontSize: 13 }}>{demo.errorMsg ?? 'Error desconocido'}</p>
      </div>
    );
  }

  // Ready — render generated HTML in full-screen iframe
  return (
    <iframe
      srcDoc={demo.html ?? ''}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 'none' }}
      title={demo.name}
      sandbox="allow-scripts allow-forms allow-popups allow-same-origin allow-top-navigation-by-user-activation"
    />
  );
}
