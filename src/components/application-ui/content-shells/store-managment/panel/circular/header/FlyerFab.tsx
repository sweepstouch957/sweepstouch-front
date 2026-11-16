'use client';

/**
 * Botón flotante "Ver flyer / circular": quien valida la lista compara contra el arte en
 * todo momento, en cualquier pestaña y también desde el teléfono (sin volver al encabezado).
 */
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import { CircularProgress, Fab, Tooltip } from '@mui/material';
import { useState } from 'react';
import { useOpenRuling } from '../catalog/use-catalog-jobs';
import { useCatalogSummary } from '../hooks';
import { ImagePreviewDialog } from '../shared';

export default function FlyerFab({ storeSlug }: { storeSlug: string }) {
  const ruling = useCatalogSummary(storeSlug).data?.ruling ?? null;
  const [img, setImg] = useState<{ url: string; title: string } | null>(null);
  const open = useOpenRuling(ruling, (url, title) => setImg({ url, title }));
  if (!ruling?.hasFile) return null;
  const label = ruling.kind === 'flyer' ? 'Ver flyer' : 'Ver circular';

  return (
    <>
      <Tooltip title={`${label}: ${ruling.title}`}>
        <Fab
          variant="extended"
          color="secondary"
          onClick={() => open.mutate()}
          disabled={open.isPending}
          aria-label={label}
          sx={{
            position: 'fixed',
            // A la izquierda del botón del bot (que vive abajo a la derecha).
            right: { xs: 84, sm: 104 },
            bottom: { xs: 20, sm: 30 },
            zIndex: (t) => t.zIndex.speedDial,
            fontWeight: 700,
            textTransform: 'none',
            boxShadow: 6,
          }}
        >
          {open.isPending ? (
            <CircularProgress
              size={18}
              color="inherit"
              sx={{ mr: 1 }}
            />
          ) : (
            <MenuBookRoundedIcon sx={{ mr: 1 }} />
          )}
          {label}
        </Fab>
      </Tooltip>
      <ImagePreviewDialog
        key={img?.url || 'none'}
        url={img?.url ?? null}
        title={img?.title}
        onClose={() => setImg(null)}
      />
    </>
  );
}
