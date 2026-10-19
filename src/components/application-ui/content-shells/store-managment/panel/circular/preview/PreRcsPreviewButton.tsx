'use client';

/**
 * "Ver Pre-RCS": abre la página real del cliente, con los productos de ESTA tienda.
 *
 * Es la única forma honesta de revisar cómo quedó el circular: el panel muestra el catálogo
 * en tabla, pero lo que el cliente ve es la lista con sus precios, su ahorro y su QR.
 *
 * Abre como un cliente REAL de la tienda (prefiere uno de prueba si existe), con un token de
 * un día. Lo que se toque ahí queda en la cuenta de ese cliente: por eso el botón dice a
 * nombre de quién abrió, y por eso el token dura poco.
 */
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Button, Tooltip } from '@mui/material';
import { usePreRcsPreview } from './use-prercs-preview';

export default function PreRcsPreviewButton({
  storeId,
  storeSlug,
}: {
  storeId: string;
  storeSlug: string;
}) {
  const preview = usePreRcsPreview(storeId, storeSlug);
  const busy = preview.isPending;

  return (
    <Tooltip title="Abre el Pre-RCS real de esta tienda, como uno de sus clientes. Lo que guardes ahí queda en esa cuenta.">
      <span>
        <Button
          variant="outlined"
          size="small"
          startIcon={<VisibilityOutlinedIcon />}
          onClick={() => storeId && storeSlug && preview.mutate()}
          disabled={busy}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999, whiteSpace: 'nowrap' }}
        >
          {busy ? 'Abriendo…' : 'Ver Pre-RCS'}
        </Button>
      </span>
    </Tooltip>
  );
}
