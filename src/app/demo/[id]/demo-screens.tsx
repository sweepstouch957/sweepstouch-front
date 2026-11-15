/** Pantallas del demo público que no son el demo en sí: no encontrado, generando, error. */
import type { ReactNode } from 'react';

function Screen({
  background,
  gap,
  children,
}: {
  background: string;
  gap: number;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap,
        fontFamily: 'system-ui, sans-serif',
        background,
      }}
    >
      {children}
    </div>
  );
}

export function DemoNotFound({ message }: { message: string }) {
  return (
    <Screen
      background="#f8f9fa"
      gap={12}
    >
      <p style={{ fontSize: 48 }}>🔗</p>
      <p style={{ fontWeight: 700, fontSize: 18, color: '#404040' }}>Demo no encontrado</p>
      <p style={{ color: '#999', fontSize: 14 }}>{message}</p>
    </Screen>
  );
}

export function DemoGenerating({ name }: { name: string }) {
  return (
    <Screen
      background="#fff"
      gap={16}
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
      <p style={{ fontWeight: 700, color: '#404040' }}>Generando demo &quot;{name}&quot;…</p>
      <p style={{ color: '#999', fontSize: 13 }}>Esto puede tardar unos segundos.</p>
    </Screen>
  );
}

export function DemoFailed({ message }: { message?: string }) {
  return (
    <Screen
      background="#f8f9fa"
      gap={12}
    >
      <p style={{ fontSize: 48 }}>⚠️</p>
      <p style={{ fontWeight: 700, fontSize: 18, color: '#404040' }}>Error al generar el demo</p>
      <p style={{ color: '#999', fontSize: 13 }}>{message ?? 'Error desconocido'}</p>
    </Screen>
  );
}
