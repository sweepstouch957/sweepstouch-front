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

import { useState } from 'react';
import { Button, Tooltip } from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import toast from 'react-hot-toast';
import axios from 'axios';
import { customerClient, type Customer } from '@/services/customerService';
import { getAuthToken } from 'src/utils/auth/custom/storage';
import { LINKTREE_ORIGIN } from 'src/utils/sweepstouch-urls';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
/** El token de la vista previa vive un día: es para mirar, no para repartir. */
const PREVIEW_TTL_DAYS = 1;
const TEST_NAMES = /(test|prueba|demo|sweepstouch)/i;

/** Un cliente para la vista previa: primero uno de prueba, si no el más reciente. */
function pickPreviewCustomer(list: Customer[]): Customer | null {
  if (!list.length) return null;
  return list.find((c) => TEST_NAMES.test(c.firstName || '')) || list[0];
}

export default function PreRcsPreviewButton({
  storeId,
  storeSlug,
}: {
  storeId: string;
  storeSlug: string;
}) {
  const [busy, setBusy] = useState(false);

  const open = async () => {
    if (!storeId || !storeSlug) return;
    setBusy(true);
    try {
      const res = await customerClient.getCustomersByStore(storeId, 1, 50);
      const customer = pickPreviewCustomer(res.data || []);
      if (!customer?._id) {
        toast.error('Esta tienda todavía no tiene clientes: no hay a nombre de quién abrir la vista previa.');
        return;
      }

      const auth = getAuthToken();
      const { data } = await axios.post(
        `${API_URL}/customers/capability-token`,
        { customerId: customer._id, storeId, ttlDays: PREVIEW_TTL_DAYS },
        { headers: auth ? { Authorization: `Bearer ${auth}` } : {} }
      );

      const url =
        `${LINKTREE_ORIGIN}/prercs/${customer._id}?store=${encodeURIComponent(storeSlug)}` +
        (data?.token ? `&token=${encodeURIComponent(data.token)}` : '');
      window.open(url, '_blank', 'noopener,noreferrer');
      toast.success(`Vista previa abierta como ${customer.firstName || customer.phoneNumber || 'cliente'}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'No se pudo abrir la vista previa del Pre-RCS');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Tooltip title="Abre el Pre-RCS real de esta tienda, como uno de sus clientes. Lo que guardes ahí queda en esa cuenta.">
      <span>
        <Button
          variant="outlined"
          size="small"
          startIcon={<VisibilityOutlinedIcon />}
          onClick={open}
          disabled={busy}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999, whiteSpace: 'nowrap' }}
        >
          {busy ? 'Abriendo…' : 'Ver Pre-RCS'}
        </Button>
      </span>
    </Tooltip>
  );
}
