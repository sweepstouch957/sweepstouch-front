'use client';

import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { QboReceivables } from './qbo-receivables';

/**
 * Cartera de QuickBooks debajo del listado de tiendas.
 *
 * Colapsado por defecto a propósito: abrirlo dispara 3 llamadas a la API de QuickBooks
 * y esta pantalla se usa sobre todo para editar tiendas, no para cobrar.
 */
export default function StoresReceivablesSection() {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, v) => setExpanded(v)}
      sx={{ mt: 3, borderRadius: 2, '&:before': { display: 'none' } }}
      variant="outlined"
    >
      <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
        <Stack direction="row"
alignItems="center"
spacing={1.5}>
          <AccountBalanceRoundedIcon color="primary" />
          <div>
            <Typography variant="subtitle1"
fontWeight={700}>
              Cartera QuickBooks
            </Typography>
            <Typography variant="body2"
color="text.secondary">
              Cuánto debe cada tienda y cuándo pagó por última vez
            </Typography>
          </div>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        {/* Se monta solo al abrir: así el fetch no sale con la página */}
        {expanded && (
          <QboReceivables
            embedded
            onSelectStore={(row) => {
              if (!row.storeId) return; // cliente de QBO sin tienda vinculada: no hay a dónde ir
              router.push(`/admin/management/stores/edit/${row.storeId}?tag=billing`);
            }}
          />
        )}
      </AccordionDetails>
    </Accordion>
  );
}
