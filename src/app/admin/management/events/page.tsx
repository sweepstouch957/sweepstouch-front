import { redirect } from 'next/navigation';

/** Eventos vive dentro de "Sorteos y eventos". Los links viejos siguen funcionando. */
export default function Page() {
  redirect('/admin/management/sweepstakes?vista=eventos');
}
