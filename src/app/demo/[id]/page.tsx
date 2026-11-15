/**
 * Demo público (link que se comparte). Se arma en el servidor —el equivalente de
 * getServerSideProps en App Router—: llega con el contenido listo (sin "Cargando demo…") y con
 * título propio para la vista previa del link. La visita se cuenta en el navegador.
 */
import { demoService, type DemoDetail } from '@/services/demo.service';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { DemoFailed, DemoGenerating, DemoNotFound } from './demo-screens';
import { TrackView } from './track-view';

type PageProps = { params: Promise<{ id: string }> };

// Una sola llamada por request aunque la usen generateMetadata y la página.
const loadDemo = cache(async (id: string): Promise<DemoDetail | { error: string }> => {
  try {
    return await demoService.getPublic(id);
  } catch (e: any) {
    return { error: e?.message ?? 'Error al cargar el demo' };
  }
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const demo = await loadDemo((await params).id);
  return 'error' in demo ? { title: 'Demo no encontrado' } : { title: demo.name };
}

export default async function DemoViewPage({ params }: PageProps) {
  const { id } = await params;
  const demo = await loadDemo(id);

  if ('error' in demo) return <DemoNotFound message={demo.error} />;
  if (demo.pinned) redirect('/demo');

  const track = <TrackView id={id} />;
  if (demo.status === 'generating')
    return (
      <>
        {track}
        <DemoGenerating name={demo.name} />
      </>
    );
  if (demo.status === 'error')
    return (
      <>
        {track}
        <DemoFailed message={demo.errorMsg} />
      </>
    );

  // Listo: el HTML generado en un iframe a pantalla completa.
  return (
    <>
      {track}
      <iframe
        srcDoc={demo.html ?? ''}
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 'none' }}
        title={demo.name}
        sandbox="allow-scripts allow-forms allow-popups allow-same-origin allow-top-navigation-by-user-activation"
      />
    </>
  );
}
