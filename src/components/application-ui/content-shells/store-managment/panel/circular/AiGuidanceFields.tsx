'use client';

/**
 * Indicaciones para la IA antes de leer un circular: texto ("sólo los productos de Cherry
 * Valley") y fotos de apoyo (la lista escrita a mano que manda el cliente, una foto de la
 * góndola…). Se usan en la subida del circular y en "Volver a extraer".
 */
import { circularService } from '@/services/circular.service';
import { uploadCampaignImage } from '@/services/upload.service';
import { useQuery } from '@tanstack/react-query';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { Box, Button, Chip, IconButton, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export function useAiGuidance(storeSlug?: string) {
  const [guidance, setGuidance] = useState('');
  const [refs, setRefs] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Reglas fijas de la tienda (cada tienda es un mundo): se guardan y los agentes las leen
  // en cada extracción y auditoría. Lo de arriba es sólo para esta vez.
  const profile = useQuery({
    queryKey: ['store-profile', storeSlug],
    queryFn: () => circularService.getStoreProfile(storeSlug!),
    enabled: !!storeSlug,
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
    if (!storeSlug || rules === savedRules) return;
    try {
      await circularService.saveStoreRules(storeSlug, rules);
      setSavedRules(rules);
      toast.success('Reglas de la tienda guardadas');
    } catch {
      toast.error('No se pudieron guardar las reglas');
    }
  };
  const departments = profile.data?.profile?.departments ?? [];

  // Lecciones: qué salió mal. Las anotan los agentes solos (foto rescaneada, precio corregido,
  // duplicado) y también la encargada. Se inyectan en cada prompt.
  const lessons = profile.data?.profile?.lessons ?? [];
  const [lesson, setLesson] = useState('');
  const [showLessons, setShowLessons] = useState(false);
  const addLesson = async () => {
    if (!storeSlug || !lesson.trim()) return;
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
    if (!storeSlug) return;
    try {
      await circularService.removeStoreLesson(storeSlug, index);
      void profile.refetch();
    } catch {
      toast.error('No se pudo borrar la lección');
    }
  };
  const AGENT_NAME: Record<string, string> = { hermes: 'Hermes', argos: 'Argos', mnemosine: 'Mnemósine', hefesto: 'Hefesto', atenea: 'Atenea', iris: 'Iris', temis: 'Temis', all: 'Todos' };

  const addPhotos = async (list: FileList | null | undefined) => {
    const files = Array.from(list || []).slice(0, 5 - refs.length);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of files) urls.push((await uploadCampaignImage(f, 'circular-refs')).url);
      setRefs((prev) => [...prev, ...urls].slice(0, 5));
    } catch {
      toast.error('No se pudo subir la foto de referencia');
    } finally {
      setUploading(false);
    }
  };

  const fields = (
    <Stack gap={1}>
      <TextField
        size="small"
        fullWidth
        multiline
        minRows={2}
        label="Indicaciones para la IA (opcional)"
        placeholder="Ej.: sólo los productos de Cherry Valley · ignora las bebidas · los precios son por libra"
        value={guidance}
        onChange={(e) => setGuidance(e.target.value.slice(0, 500))}
      />
      {storeSlug && (
        <>
          <TextField
            size="small"
            fullWidth
            multiline
            minRows={2}
            label="Lógica de esta tienda (instrucciones fijas para los agentes)"
            placeholder="Cómo funciona ESTA tienda: las carnes son por libra aunque no lo diga · los precios 2/$5 son por unidad, no combinables · la letra chica va en rojo bajo el precio · ignora la página de cerveza · los productos Cherry Valley son marca propia · 'c/u' significa cada uno"
            value={rules}
            onChange={(e) => setRules(e.target.value.slice(0, 2000))}
            onBlur={() => void saveRules()}
            helperText={rules !== savedRules ? 'Sin guardar: se guarda al salir del campo' : 'Sólo para esta tienda. Argos la lee al extraer, Atenea al auditar e Iris al rescanear fotos; cada tienda tiene la suya'}
          />
          <Stack direction="row" gap={1} alignItems="flex-start">
            <TextField
              size="small"
              fullWidth
              label="Dile a los agentes qué salió mal"
              placeholder="Ej.: las fotos de bebidas salen con varios productos, recorta sólo una botella · los precios 2/$5 los leen como $2.50"
              value={lesson}
              onChange={(e) => setLesson(e.target.value.slice(0, 300))}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void addLesson(); } }}
            />
            <Button size="small" variant="outlined" disabled={!lesson.trim()} onClick={() => void addLesson()} sx={{ whiteSpace: 'nowrap', mt: 0.25 }}>
              Anotar
            </Button>
          </Stack>
          {lessons.length > 0 && (
            <Box>
              <Button size="small" variant="text" onClick={() => setShowLessons((v) => !v)} sx={{ px: 0.5 }}>
                {showLessons ? 'Ocultar' : 'Ver'} lecciones aprendidas ({lessons.length})
              </Button>
              {showLessons && (
                <Stack gap={0.5} sx={{ mt: 0.5, maxHeight: 220, overflowY: 'auto', pr: 0.5 }}>
                  {lessons.map((l, i) => (
                    <Stack key={`${i}-${l.at}`} direction="row" alignItems="flex-start" gap={0.75}>
                      <Chip size="small" variant={l.source === 'manual' ? 'filled' : 'outlined'} color={l.source === 'manual' ? 'primary' : 'default'} label={AGENT_NAME[l.agent] || l.agent} sx={{ height: 18, fontSize: 10, flexShrink: 0, mt: 0.25 }} />
                      <Typography variant="caption" color="text.secondary" sx={{ flex: 1, overflowWrap: 'anywhere' }}>{l.text}</Typography>
                      <IconButton size="small" aria-label="Borrar lección" onClick={() => void removeLesson(i)} sx={{ p: 0.25 }}>
                        <CloseRoundedIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Box>
          )}
          {departments.length > 0 && (
            <Stack direction="row" alignItems="center" gap={0.5} flexWrap="wrap">
              <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>Departamentos que Mnemósine aprendió:</Typography>
              {departments.map((d) => <Chip key={d} size="small" variant="outlined" label={d} sx={{ height: 20, fontSize: 11 }} />)}
            </Stack>
          )}
        </>
      )}
      <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
        <Button component="label" size="small" variant="outlined" startIcon={<AddPhotoAlternateOutlinedIcon />} disabled={uploading || refs.length >= 5}>
          {uploading ? 'Subiendo…' : 'Adjuntar fotos de referencia'}
          <input hidden type="file" accept="image/*" multiple onChange={(e) => { void addPhotos(e.target.files); e.target.value = ''; }} />
        </Button>
        {refs.map((url) => (
          <Box key={url} sx={{ position: 'relative' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" style={{ height: 44, borderRadius: 6, border: '1px solid #e5e5e5', display: 'block' }} />
            <IconButton size="small" aria-label="Quitar foto" onClick={() => setRefs((p) => p.filter((u) => u !== url))} sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', p: 0.25 }}>
              <CloseRoundedIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        ))}
        {!refs.length && (
          <Typography variant="body2" color="text.secondary">
            Lo que manda el cliente: una lista escrita a mano, una foto de los productos. La IA busca eso en el circular.
          </Typography>
        )}
      </Stack>
    </Stack>
  );

  return { guidance, referenceImages: refs, fields, reset: () => { setGuidance(''); setRefs([]); } };
}
