'use client';

import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import BrushRoundedIcon from '@mui/icons-material/BrushRounded';
import SmsRoundedIcon from '@mui/icons-material/SmsRounded';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import React from 'react';
import { ALL_TAGS, TAG_LABEL } from './constants';
import { enhanceBrief } from './enhance-brief';
import { RichTextArea } from './rich-text-area';
import { SavingsButton } from './savings-button';
import { useDesignStore } from './store';
import type { CardTag, CardType, DesignStore } from './types';
import { useDesignStores, useEmployees, type Employee } from './use-design-data';

/**
 * Alta de tarjeta.
 *
 * El tipo se decide acá y no se puede cambiar después. MMS y Especial son dos
 * formularios distintos, no el mismo con campos ocultos: un especial no tiene
 * vigencia de flyer, ni cantidad de productos, ni savings — tiene un pedido
 * escrito y alguien que lo pide.
 */

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}

const today = (): string => new Date().toISOString().slice(0, 10);
const inDays = (n: number): string =>
  new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

export function CreateCardDialog({ open, onClose, onCreated }: Props): React.JSX.Element {
  const theme = useTheme();
  const createCard = useDesignStore((s) => s.createCard);
  const designers = useDesignStore((s) => s.designers);
  const { stores, loadingStores } = useDesignStores();
  const { employees, loadingEmployees } = useEmployees();

  const [kind, setKind] = React.useState<'mms' | 'especial'>('mms');
  const [circular, setCircular] = React.useState(false);
  const [store, setStore] = React.useState<DesignStore | null>(null);
  const [promoStart, setPromoStart] = React.useState(today);
  const [promoEnd, setPromoEnd] = React.useState(() => inDays(6));
  const [designerId, setDesignerId] = React.useState('');
  const [productCount, setProductCount] = React.useState(6);
  const [tags, setTags] = React.useState<CardTag[]>([]);
  const [productList, setProductList] = React.useState('');
  const [brief, setBrief] = React.useState('');
  const [requester, setRequester] = React.useState<Employee | null>(null);
  const [enhancing, setEnhancing] = React.useState(false);
  const [note, setNote] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    setKind('mms');
    setCircular(false);
    setStore(null);
    setPromoStart(today());
    setPromoEnd(inDays(6));
    setDesignerId('');
    setProductCount(6);
    setTags([]);
    setProductList('');
    setBrief('');
    setRequester(null);
    setNote('');
  }, [open]);

  const isEspecial = kind === 'especial';
  const type: CardType = isEspecial ? 'especial' : circular ? 'mms_circular' : 'mms';

  const missing: string[] = [];
  if (!store) missing.push('supermercado');
  if (!designerId) missing.push('diseñador asignado');
  if (isEspecial) {
    if (!brief.trim()) missing.push('brief');
    if (!requester) missing.push('solicitante');
  } else if (!promoStart || !promoEnd) {
    missing.push('fechas de promoción');
  }
  const datesInverted = !isEspecial && !!promoStart && !!promoEnd && promoEnd < promoStart;
  const blocked = missing.length > 0 || datesInverted;

  const runEnhance = async () => {
    setEnhancing(true);
    try {
      setBrief(await enhanceBrief(brief));
      setNote('Pedido reescrito por IA. Revisalo antes de crear la tarjeta.');
    } finally {
      setEnhancing(false);
    }
  };

  const submit = () => {
    if (!store) return;
    const id = createCard({
      type,
      storeId: store.id,
      storeName: store.name,
      address: store.address,
      // Un especial no tiene vigencia de flyer.
      promoStart: isEspecial ? '' : promoStart,
      promoEnd: isEspecial ? '' : promoEnd,
      designerId: designerId || null,
      productCount: isEspecial ? 0 : productCount,
      tags: isEspecial ? [] : tags,
      productList: isEspecial ? '' : productList,
      brief: isEspecial ? brief : '',
      requesterId: requester?.id ?? null,
      requesterName: requester?.name ?? null,
    });
    onCreated(id);
    onClose();
  };

  const typeCard = (
    value: 'mms' | 'especial',
    label: string,
    icon: React.ReactNode,
    hint: string
  ) => {
    const selected = kind === value;
    return (
      <Box
        onClick={() => setKind(value)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setKind(value)}
        sx={{
          flex: 1,
          p: 2.5,
          borderRadius: 2,
          cursor: 'pointer',
          textAlign: 'center',
          border: '2px solid',
          borderColor: selected ? 'primary.main' : 'divider',
          bgcolor: selected ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
          transition: 'all .15s',
        }}
      >
        <Box sx={{ color: selected ? 'primary.main' : 'text.disabled', mb: 0.5 }}>{icon}</Box>
        <Typography
          variant="subtitle1"
          fontWeight={800}
        >
          {label}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
        >
          {hint}
        </Typography>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 800 }}>Agregar tarjeta</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Stack
            direction="row"
            spacing={2}
          >
            {typeCard('mms', 'MMS', <SmsRoundedIcon fontSize="large" />, 'Flyer semanal')}
            {typeCard(
              'especial',
              'ESPECIAL',
              <BrushRoundedIcon fontSize="large" />,
              'Pieza a medida, con pedido escrito'
            )}
          </Stack>

          {!isEspecial && (
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={circular}
                  onChange={(e) => setCircular(e.target.checked)}
                />
              }
              label={
                <Typography variant="body2">
                  Crear como Modalidad circular
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    (cuenta como MMS en métricas)
                  </Typography>
                </Typography>
              }
            />
          )}

          {/* Supermercado y diseñador: obligatorios en los dos tipos */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
          >
            <Autocomplete
              sx={{ flex: 1 }}
              options={stores}
              loading={loadingStores}
              value={store}
              getOptionLabel={(s) => s.name}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              onChange={(_, value) => setStore(value)}
              renderOption={(props, s) => (
                <Box
                  component="li"
                  {...props}
                  key={s.id}
                >
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                  >
                    <Avatar
                      src={s.image}
                      sx={{ width: 28, height: 28 }}
                    >
                      {s.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2">{s.name}</Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {s.address}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label="Supermercado"
                  required
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingStores ? <CircularProgress size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
            <TextField
              select
              fullWidth
              size="small"
              label="Diseñador asignado"
              value={designerId}
              onChange={(e) => setDesignerId(e.target.value)}
              required
              SelectProps={{ native: true }}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            >
              <option value="" />
              {designers.map((d) => (
                <option
                  key={d.id}
                  value={d.id}
                >
                  {d.name}
                </option>
              ))}
            </TextField>
          </Stack>

          {store && (
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Dirección: {store.address}
            </Typography>
          )}

          {isEspecial ? (
            /* ── Diseño Especial: el pedido va escrito ── */
            <>
              <Autocomplete
                options={employees}
                loading={loadingEmployees}
                value={requester}
                getOptionLabel={(e) => e.name}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                onChange={(_, value) => setRequester(value)}
                renderOption={(props, e) => (
                  <Box
                    component="li"
                    {...props}
                    key={e.id}
                  >
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                    >
                      <Avatar
                        src={e.avatar}
                        sx={{ width: 28, height: 28 }}
                      >
                        {e.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2">{e.name}</Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {e.jobTitle}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    label="¿Quién lo solicita?"
                    required
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingEmployees ? <CircularProgress size={16} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />

              <Box>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 0.5 }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Brief — escribí el pedido completo con tus palabras
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={
                      enhancing ? (
                        <CircularProgress size={14} />
                      ) : (
                        <AutoAwesomeRoundedIcon />
                      )
                    }
                    disabled={!brief.trim() || enhancing}
                    onClick={runEnhance}
                  >
                    Enhance pedido
                  </Button>
                </Stack>
                <TextField
                  fullWidth
                  multiline
                  minRows={6}
                  size="small"
                  required
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="Ej: necesito un banner para el sorteo del Día de las Madres, en tonos pastel, con una foto de familia y sin precios."
                />
                {note && (
                  <Typography
                    variant="caption"
                    color="success.main"
                  >
                    {note}
                  </Typography>
                )}
              </Box>
            </>
          ) : (
            /* ── MMS: vigencia, productos, etiquetas y lista ── */
            <>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
              >
                <TextField
                  type="date"
                  size="small"
                  fullWidth
                  label="Promoción desde"
                  InputLabelProps={{ shrink: true }}
                  value={promoStart}
                  onChange={(e) => setPromoStart(e.target.value)}
                />
                <TextField
                  type="date"
                  size="small"
                  fullWidth
                  label="Promoción hasta"
                  InputLabelProps={{ shrink: true }}
                  value={promoEnd}
                  onChange={(e) => setPromoEnd(e.target.value)}
                  error={datesInverted}
                />
                <TextField
                  type="number"
                  size="small"
                  fullWidth
                  label="Cantidad de productos"
                  value={productCount}
                  onChange={(e) =>
                    setProductCount(Math.max(0, Math.floor(Number(e.target.value)) || 0))
                  }
                  inputProps={{ min: 0 }}
                />
              </Stack>

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mb: 0.5 }}
                >
                  Etiquetas
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                >
                  {ALL_TAGS.map((tag) => (
                    <Chip
                      key={tag}
                      label={TAG_LABEL[tag]}
                      size="small"
                      variant={tags.includes(tag) ? 'filled' : 'outlined'}
                      color={tags.includes(tag) ? 'primary' : 'default'}
                      onClick={() =>
                        setTags((prev) =>
                          prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                        )
                      }
                    />
                  ))}
                </Stack>
              </Box>

              <Box>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 0.5 }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Lista de productos — se puede pegar texto e imágenes (Ctrl+V)
                  </Typography>
                  {/* Los savings se pueden generar acá mismo, sin esperar al detalle. */}
                  <SavingsButton
                    productList={productList}
                    tags={tags}
                    canEdit
                    onApply={setProductList}
                    onResult={setNote}
                  />
                </Stack>
                <RichTextArea
                  value={productList}
                  onChange={setProductList}
                  minHeight={140}
                  placeholder={'GREEN GIANT\nIDAHO POTATOES\n$1.99 EA\nREG $3.99 EA'}
                  ariaLabel="Lista de productos"
                />
                {note && (
                  <Typography
                    variant="caption"
                    color="success.main"
                  >
                    {note}
                  </Typography>
                )}
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>

      {/* Pie fijo: el aviso vive acá para que no se pierda con el scroll de la
          lista de productos, que es justo cuando más largo se pone el modal. */}
      <DialogActions sx={{ px: 3, py: 1.5, gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {blocked && (
            <Alert
              severity={datesInverted ? 'error' : 'info'}
              sx={{ py: 0, '& .MuiAlert-message': { py: 0.75 } }}
            >
              <Typography
                variant="caption"
                noWrap
              >
                {datesInverted
                  ? 'La fecha final de promoción es anterior a la inicial.'
                  : `Falta ${missing.join(', ')}.`}
              </Typography>
            </Alert>
          )}
        </Box>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          disabled={blocked}
          onClick={submit}
        >
          Crear tarjeta
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreateCardDialog;
