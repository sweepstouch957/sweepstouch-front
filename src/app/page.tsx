import { redirect } from 'next/navigation';
import { routes } from 'src/router/routes';

// Default entry point: send users to the admin area.
// If auth middleware/guards exist, they will handle unauthenticated users.
export default function Page() {
  redirect(routes.admin.index);
}
