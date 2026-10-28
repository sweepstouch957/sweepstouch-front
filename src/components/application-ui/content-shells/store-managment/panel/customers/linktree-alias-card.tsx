'use client';

/**
 * Store.linktreeStoreSlug: el linktree de esta tienda abre el de otra de la cadena
 * (ej. la 3900 muestra el de la 490: landing, Mi cuenta, listas, todo). Vacío = el propio.
 */
import { useStoreSearch } from '@/hooks/fetching/stores/useStoreSearch';
import { updateStorePatch, type Store } from '@/services/store.service';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import { Autocomplete, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function LinktreeAliasCard({
  storeId,
  slug,
  linktreeStoreSlug = '',
}: {
  storeId: string;
  slug?: string;
  linktreeStoreSlug?: string;
}) {
  const [current, setCurrent] = useState(linktreeStoreSlug);
  const [term, setTerm] = useState('');
  const [picked, setPicked] = useState<Store | null>(null);
  const { options, loading, needsMoreChars } = useStoreSearch(term);
  const qc = useQueryClient();

  const save = useMutation({
    mutationFn: (target: string) => updateStorePatch(storeId, { linktreeStoreSlug: target }),
    onSuccess: (_r, target) => {
      setCurrent(target);
      setPicked(null);
      toast.success(target ? 'El linktree ahora abre la otra tienda' : 'El linktree vuelve a ser el propio');
      qc.invalidateQueries({ queryKey: ['store', storeId] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo guardar'),
  });

  return (
    <Paper
      variant="outlined"
      sx={{ p: { xs: 1.5, sm: 2 }, mb: 3, borderRadius: 3 }}
    >
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        mb={1}
        color="text.secondary"
      >
        <LinkRoundedIcon fontSize="small" />
        <Typography
          variant="overline"
          fontWeight={700}
          letterSpacing={0.8}
        >
          Linktree
        </Typography>
      </Stack>
      <Typography
        variant="body2"
        color="text.secondary"
        mb={1.5}
      >
        {current
          ? `El link de esta tienda (${slug}) abre el linktree de: ${current}`
          : 'Usa su propio linktree. Elegí otra tienda de la cadena para que su link abra esa.'}
      </Typography>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        gap={1.5}
      >
        <Autocomplete
          sx={{ flex: 1 }}
          value={picked}
          onChange={(_, v) => setPicked(v)}
          onInputChange={(_, v) => setTerm(v)}
          options={options.filter((o) => o._id !== storeId && o.slug)}
          loading={loading}
          getOptionLabel={(o) => o.name || ''}
          isOptionEqualToValue={(o, v) => o._id === v._id}
          noOptionsText={needsMoreChars ? 'Escribí al menos 2 letras' : 'Sin resultados'}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              label="Mostrar el linktree de…"
            />
          )}
        />
        <Button
          variant="contained"
          disableElevation
          disabled={!picked || save.isPending}
          onClick={() => picked?.slug && save.mutate(picked.slug)}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
        >
          Guardar
        </Button>
        {current && (
          <Button
            color="inherit"
            disabled={save.isPending}
            onClick={() => save.mutate('')}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Quitar
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
