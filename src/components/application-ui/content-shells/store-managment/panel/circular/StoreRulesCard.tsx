'use client';

/**
 * Cómo funciona ESTA tienda para los agentes: reglas fijas (Argos las lee al extraer, Atenea al
 * auditar, Iris al rescanear fotos), lecciones de lo que salió mal y los departamentos que
 * aprendió Mnemósine. Antes vivía mezclado con las indicaciones de una sola extracción.
 */
import { circularService } from '@/services/circular.service';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { Box, Button, Chip, IconButton, Stack, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { SectionHeader, Surface } from './panelUi';

const AGENT_NAME: Record<string, string> = {
  hermes: 'Hermes',
  argos: 'Argos',
  mnemosine: 'Mnemósine',
  hefesto: 'Hefesto',
  atenea: 'Atenea',
  iris: 'Iris',
  temis: 'Temis',
  all: 'Todos',
};

export default function StoreRulesCard({
  storeSlug,
  step = 1,
}: {
  storeSlug: string;
  step?: number;
}) {
  const profile = useQuery({
    queryKey: ['store-profile', storeSlug],
    queryFn: () => circularService.getStoreProfile(storeSlug),
    staleTime: 60_000,
  });
  const [rules, setRules] = useState('');
  const [savedRules, setSavedRules] = useState('');
  useEffect(() => {
    const r = profile.data?.profile?.rules ?? '';
    setRules(r);
    setSavedRules(r);
  }, [profile.data]);
  const saveRules = async () => {
    if (rules === savedRules) return;
    try {
      await circularService.saveStoreRules(storeSlug, rules);
      setSavedRules(rules);
      toast.success('Reglas de la tienda guardadas');
    } catch {
      toast.error('No se pudieron guardar las reglas');
    }
  };

  const lessons = profile.data?.profile?.lessons ?? [];
  const departments = profile.data?.profile?.departments ?? [];
  const [lesson, setLesson] = useState('');
  const addLesson = async () => {
    if (!lesson.trim()) return;
    try {
      await circularService.addStoreLesson(storeSlug, lesson.trim());
      setLesson('');
      toast.success('Lección guardada: los agentes la leen en la próxima lectura');
      void profile.refetch();
    } catch {
      toast.error('No se pudo guardar la lección');
    }
  };
  const removeLesson = async (index: number) => {
    try {
      await circularService.removeStoreLesson(storeSlug, index);
      void profile.refetch();
    } catch {
      toast.error('No se pudo borrar la lección');
    }
  };

  return (
    <Surface sx={{ p: { xs: 2, md: 2.5 } }}>
      <Stack spacing={2}>
        <SectionHeader
          step={step}
          title="Cómo funciona esta tienda"
          description="Instrucciones fijas que los agentes leen en cada lectura, auditoría y rescaneo. Cada tienda tiene las suyas; lo de una sola extracción va en la pestaña Circular."
        />
        <TextField
          size="small"
          fullWidth
          multiline
          minRows={3}
          label="Reglas de la tienda"
          placeholder="Las carnes son por libra aunque no lo diga · los precios 2/$5 son por unidad, no combinables · la letra chica va en rojo bajo el precio · ignora la página de cerveza · los productos Cherry Valley son marca propia · 'c/u' significa cada uno"
          value={rules}
          onChange={(e) => setRules(e.target.value.slice(0, 2000))}
          onBlur={() => void saveRules()}
          helperText={
            rules !== savedRules
              ? 'Sin guardar: se guarda al salir del campo'
              : 'Argos la lee al extraer, Atenea al auditar e Iris al rescanear fotos'
          }
        />
        <Box>
          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{ mb: 0.75 }}
          >
            Lecciones aprendidas ({lessons.length})
          </Typography>
          <Stack
            direction="row"
            gap={1}
            alignItems="flex-start"
          >
            <TextField
              size="small"
              fullWidth
              label="Dile a los agentes qué salió mal"
              placeholder="Ej.: las fotos de bebidas salen con varios productos, recorta sólo una botella · los precios 2/$5 los leen como $2.50"
              value={lesson}
              onChange={(e) => setLesson(e.target.value.slice(0, 300))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void addLesson();
                }
              }}
            />
            <Button
              size="small"
              variant="outlined"
              disabled={!lesson.trim()}
              onClick={() => void addLesson()}
              sx={{ whiteSpace: 'nowrap', mt: 0.25 }}
            >
              Anotar
            </Button>
          </Stack>
          {lessons.length > 0 && (
            <Stack
              gap={0.5}
              sx={{ mt: 1, maxHeight: 260, overflowY: 'auto', pr: 0.5 }}
            >
              {lessons.map((l, i) => (
                <Stack
                  key={`${i}-${l.at}`}
                  direction="row"
                  alignItems="flex-start"
                  gap={0.75}
                >
                  <Chip
                    size="small"
                    variant={l.source === 'manual' ? 'filled' : 'outlined'}
                    color={l.source === 'manual' ? 'primary' : 'default'}
                    label={AGENT_NAME[l.agent] || l.agent}
                    sx={{ height: 18, fontSize: 10, flexShrink: 0, mt: 0.25 }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ flex: 1, overflowWrap: 'anywhere' }}
                  >
                    {l.text}
                  </Typography>
                  <IconButton
                    size="small"
                    aria-label="Borrar lección"
                    onClick={() => void removeLesson(i)}
                    sx={{ p: 0.25 }}
                  >
                    <CloseRoundedIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          )}
        </Box>
        {departments.length > 0 && (
          <Stack
            direction="row"
            alignItems="center"
            gap={0.5}
            flexWrap="wrap"
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mr: 0.5 }}
            >
              Departamentos que Mnemósine aprendió:
            </Typography>
            {departments.map((d) => (
              <Chip
                key={d}
                size="small"
                variant="outlined"
                label={d}
                sx={{ height: 20, fontSize: 11 }}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </Surface>
  );
}
