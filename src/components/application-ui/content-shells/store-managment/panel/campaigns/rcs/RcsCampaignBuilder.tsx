'use client';

/**
 * Builder de campañas RCS (canal Google vía Infobip, sender único "sweepstouch").
 *
 * Todo el RCS se arma elemento por elemento:
 *  - productos del catálogo → cards del carrusel (título/descripción/botón editables)
 *  - botones globales (ver ofertas / mi lista / URL propia / llamar)
 *  - SMS de failover para teléfonos sin RCS
 * Con preview del teléfono en vivo. Los links de los botones son los short links
 * por cliente (tracking de clicks) y abren la página RCS en webview a pantalla
 * completa — eso lo resuelve el scheduler al enviar.
 */

import { campaignClient } from '@/services/campaing.service';
import { circularService } from '@/services/circular.service';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

// Color del agente RCS aprobado en Google (perfil "Sweepstouch").
const RCS_PINK = '#E60073';
const BTN_TEXT_MAX = 25; // límite RBM para el texto de un botón

interface CatalogProduct {
  _id: string;
  name: string;
  price?: string;
  originalPrice?: string;
  savings?: string;
  brand?: string;
  size?: string;
  imageUrl?: string;
  category?: string;
}

interface CardEdit {
  title: string;
  description: string;
  buttonText: string;
}

type BtnKind = 'offers' | 'list' | 'url' | 'call';

interface GlobalBtn {
  text: string;
  kind: BtnKind;
  url?: string;
  phoneNumber?: string;
}

const BTN_KIND_LABEL: Record<BtnKind, string> = {
  offers: 'Abrir ofertas (webview)',
  list: 'Mi lista (webview)',
  url: 'URL personalizada',
  call: 'Llamar',
};

const defaultDescription = (p: CatalogProduct) =>
  [
    p.brand,
    p.size,
    /\d/.test(p.savings || '')
      ? `Ahorra ${p.savings}`
      : p.originalPrice
        ? `Antes ${p.originalPrice}`
        : '',
  ]
    .filter(Boolean)
    .join(' · ') || 'Oferta de esta semana';

const defaultCardEdit = (p: CatalogProduct): CardEdit => ({
  title: `${p.name}${p.price ? ` — ${p.price}` : ''}`,
  description: defaultDescription(p),
  buttonText: '🛒 Agregar a mi lista',
});

export default function RcsCampaignBuilder({
  storeId,
  storeSlug,
  storeName,
  phoneNumber,
  totalAudience,
  onCreate,
}: {
  storeId: string;
  storeSlug: string;
  storeName: string;
  phoneNumber: string;
  totalAudience: number;
  onCreate: () => void;
}) {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [failover, setFailover] = useState(
    `Hola! Mira las ofertas de la semana de ${storeName} 👉 #linkrcs Reply STOP to unsubscribe`
  );
  const [selected, setSelected] = useState<string[]>([]); // ids en orden de selección
  const [cardEdits, setCardEdits] = useState<Record<string, CardEdit>>({});
  const [buttons, setButtons] = useState<GlobalBtn[]>([
    { text: '🛍️ Ver todas las ofertas', kind: 'offers' },
    { text: '📝 Mi lista', kind: 'list' },
  ]);
  const [search, setSearch] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({
    open: false,
    msg: '',
    sev: 'success',
  });

  const { data: catalog, isLoading: loadingCatalog } = useQuery({
    queryKey: ['store-catalog', storeSlug],
    queryFn: () => circularService.getStoreCatalog(storeSlug),
    enabled: !!storeSlug,
    staleTime: 60_000,
  });

  const products: CatalogProduct[] = catalog?.items || [];
  const byId = useMemo(() => new Map(products.map((p) => [p._id, p])), [products]);
  const filtered = useMemo(
    () =>
      search
        ? products.filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()))
        : products,
    [products, search]
  );

  const toggleProduct = (p: CatalogProduct) => {
    setSelected((prev) => {
      if (prev.includes(p._id)) return prev.filter((id) => id !== p._id);
      if (prev.length >= 10) {
        setSnack({ open: true, msg: 'Máximo 10 productos en el carrusel', sev: 'error' });
        return prev;
      }
      setCardEdits((e) => (e[p._id] ? e : { ...e, [p._id]: defaultCardEdit(p) }));
      return [...prev, p._id];
    });
  };

  const setEdit = (id: string, patch: Partial<CardEdit>) =>
    setCardEdits((e) => ({ ...e, [id]: { ...e[id], ...patch } }));

  const setBtn = (i: number, patch: Partial<GlobalBtn>) =>
    setButtons((b) => b.map((btn, idx) => (idx === i ? { ...btn, ...patch } : btn)));

  const cards = selected
    .map((id) => {
      const p = byId.get(id);
      const e = cardEdits[id];
      if (!p || !e) return null;
      return {
        productId: id,
        title: e.title,
        description: e.description,
        buttonText: e.buttonText,
        imageUrl: p.imageUrl || '',
      };
    })
    .filter(Boolean) as Array<{
    productId: string;
    title: string;
    description: string;
    buttonText: string;
    imageUrl: string;
  }>;

  const canSubmit = !!title.trim() && cards.length >= 2 && !!failover.trim();

  const mutation = useMutation({
    mutationFn: async () =>
      campaignClient.createCampaign(
        {
          title,
          description: 'Campaña RCS (carrusel)',
          content: failover,
          startDate,
          channel: 'rcs',
          customAudience: totalAudience,
          platform: 'infobip',
          sourceTn: phoneNumber,
          rcsOptions: {
            maxProducts: cards.length,
            cards,
            suggestions: buttons.filter((b) => b.text.trim()),
          },
        } as any,
        storeId
      ),
    onSuccess: () => {
      setConfirmOpen(false);
      setSnack({ open: true, msg: '¡Campaña RCS creada! 🎉', sev: 'success' });
      setTimeout(onCreate, 700);
    },
    onError: () => {
      setConfirmOpen(false);
      setSnack({ open: true, msg: 'Error creando la campaña RCS', sev: 'error' });
    },
  });

  return (
    <Box>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <Card
        sx={{
          p: 2.5,
          mb: 2.5,
          color: '#fff',
          background: `linear-gradient(120deg, ${RCS_PINK} 0%, #a3009c 55%, #5b21b6 100%)`,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          flexWrap="wrap"
        >
          <Avatar sx={{ bgcolor: '#fff', color: RCS_PINK, fontWeight: 900 }}>
            <ForumRoundedIcon />
          </Avatar>
          <Box flex={1}
minWidth={220}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.8}
            >
              <Typography
                variant="h6"
                fontWeight={800}
              >
                Campaña RCS
              </Typography>
              <VerifiedRoundedIcon sx={{ fontSize: 18 }} />
            </Stack>
            <Typography
              variant="body2"
              sx={{ opacity: 0.9 }}
            >
              Sender «sweepstouch» (agente Google verificado) · {storeName}
            </Typography>
          </Box>
          <Chip
            label={`Audiencia: ${totalAudience.toLocaleString()} clientes`}
            sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', fontWeight: 600 }}
          />
        </Stack>
      </Card>

      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', md: '1fr 340px' }}
        gap={2.5}
        alignItems="start"
      >
        {/* ── Config ─────────────────────────────────────────────────────── */}
        <Stack spacing={2.5}>
          {/* Datos */}
          <Card
            variant="outlined"
            sx={{ p: 2.5 }}
          >
            <Typography
              variant="subtitle1"
              fontWeight={700}
              mb={2}
            >
              1 · Datos de la campaña
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
            >
              <TextField
                label="Título de la campaña"
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <DateTimePicker
                label="Fecha de envío"
                value={startDate}
                onChange={(d) => d && setStartDate(d)}
                sx={{ minWidth: 220 }}
              />
            </Stack>
          </Card>

          {/* Productos */}
          <Card
            variant="outlined"
            sx={{ p: 2.5 }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              mb={1.5}
            >
              <Typography
                variant="subtitle1"
                fontWeight={700}
              >
                2 · Productos del carrusel
              </Typography>
              <Chip
                size="small"
                color={cards.length >= 2 ? 'success' : 'default'}
                label={`${selected.length}/10 · mínimo 2`}
              />
            </Stack>

            <TextField
              size="small"
              fullWidth
              placeholder="Buscar producto…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ mb: 1.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            {loadingCatalog ? (
              <Box
                py={4}
                textAlign="center"
              >
                <CircularProgress size={28} />
              </Box>
            ) : products.length === 0 ? (
              <Alert severity="warning">
                Esta tienda no tiene productos en su catálogo. Cargalos en la página de
                Productos antes de crear la campaña RCS.
              </Alert>
            ) : (
              <Box
                display="grid"
                gridTemplateColumns={{ xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }}
                gap={1.5}
                maxHeight={380}
                overflow="auto"
                pr={0.5}
              >
                {filtered.map((p) => {
                  const idx = selected.indexOf(p._id);
                  const isSel = idx >= 0;
                  return (
                    <Card
                      key={p._id}
                      variant="outlined"
                      onClick={() => toggleProduct(p)}
                      sx={{
                        cursor: 'pointer',
                        position: 'relative',
                        borderColor: isSel ? RCS_PINK : 'divider',
                        borderWidth: isSel ? 2 : 1,
                        transition: 'all .15s',
                        '&:hover': { borderColor: RCS_PINK, transform: 'translateY(-2px)' },
                      }}
                    >
                      {isSel && (
                        <Avatar
                          sx={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            width: 22,
                            height: 22,
                            fontSize: 12,
                            fontWeight: 800,
                            bgcolor: RCS_PINK,
                            zIndex: 1,
                          }}
                        >
                          {idx + 1}
                        </Avatar>
                      )}
                      <Box
                        sx={{
                          height: 84,
                          bgcolor: 'action.hover',
                          backgroundImage: p.imageUrl ? `url(${p.imageUrl})` : undefined,
                          backgroundSize: 'contain',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                        }}
                      />
                      <Box p={1}>
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          display="block"
                          noWrap
                        >
                          {p.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color={isSel ? RCS_PINK : 'text.secondary'}
                          fontWeight={700}
                        >
                          {p.price || '—'}
                        </Typography>
                      </Box>
                    </Card>
                  );
                })}
              </Box>
            )}
          </Card>

          {/* Cards editor */}
          {cards.length > 0 && (
            <Card
              variant="outlined"
              sx={{ p: 2.5 }}
            >
              <Typography
                variant="subtitle1"
                fontWeight={700}
                mb={0.5}
              >
                3 · Personalizá cada card
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                mb={1.5}
              >
                Título, descripción y texto del botón. El botón agrega el producto a la lista
                del cliente y abre la página a pantalla completa.
              </Typography>

              {selected.map((id, i) => {
                const p = byId.get(id);
                const e = cardEdits[id];
                if (!p || !e) return null;
                return (
                  <Accordion
                    key={id}
                    disableGutters
                    variant="outlined"
                    sx={{ '&:before': { display: 'none' }, mb: 1 }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1.5}
                        minWidth={0}
                      >
                        <Avatar
                          variant="rounded"
                          src={p.imageUrl}
                          sx={{ width: 34, height: 34, bgcolor: 'action.hover' }}
                        >
                          <EditRoundedIcon fontSize="small" />
                        </Avatar>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          noWrap
                        >
                          {i + 1} · {e.title}
                        </Typography>
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={1.5}>
                        <TextField
                          size="small"
                          label="Título de la card"
                          value={e.title}
                          onChange={(ev) => setEdit(id, { title: ev.target.value.slice(0, 200) })}
                          fullWidth
                        />
                        <TextField
                          size="small"
                          label="Descripción"
                          value={e.description}
                          onChange={(ev) =>
                            setEdit(id, { description: ev.target.value.slice(0, 2000) })
                          }
                          fullWidth
                          multiline
                          rows={2}
                        />
                        <TextField
                          size="small"
                          label={`Texto del botón (${e.buttonText.length}/${BTN_TEXT_MAX})`}
                          value={e.buttonText}
                          onChange={(ev) =>
                            setEdit(id, { buttonText: ev.target.value.slice(0, BTN_TEXT_MAX) })
                          }
                          sx={{ maxWidth: 320 }}
                        />
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Card>
          )}

          {/* Botones globales */}
          <Card
            variant="outlined"
            sx={{ p: 2.5 }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              mb={1.5}
            >
              <Typography
                variant="subtitle1"
                fontWeight={700}
              >
                4 · Botones del mensaje
              </Typography>
              <Button
                size="small"
                startIcon={<AddRoundedIcon />}
                disabled={buttons.length >= 4}
                onClick={() => setButtons((b) => [...b, { text: '', kind: 'url', url: '' }])}
              >
                Agregar botón
              </Button>
            </Stack>

            <Stack spacing={1.5}>
              {buttons.map((b, i) => (
                <Stack
                  key={i}
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  alignItems={{ sm: 'center' }}
                >
                  <TextField
                    size="small"
                    label={`Texto (${b.text.length}/${BTN_TEXT_MAX})`}
                    value={b.text}
                    onChange={(e) => setBtn(i, { text: e.target.value.slice(0, BTN_TEXT_MAX) })}
                    sx={{ flex: 1, minWidth: 180 }}
                  />
                  <TextField
                    size="small"
                    select
                    label="Acción"
                    value={b.kind}
                    onChange={(e) => setBtn(i, { kind: e.target.value as BtnKind })}
                    sx={{ minWidth: 200 }}
                  >
                    {(Object.keys(BTN_KIND_LABEL) as BtnKind[]).map((k) => (
                      <MenuItem
                        key={k}
                        value={k}
                      >
                        {BTN_KIND_LABEL[k]}
                      </MenuItem>
                    ))}
                  </TextField>
                  {b.kind === 'url' && (
                    <TextField
                      size="small"
                      label="URL"
                      value={b.url || ''}
                      onChange={(e) => setBtn(i, { url: e.target.value })}
                      sx={{ flex: 1, minWidth: 200 }}
                    />
                  )}
                  {b.kind === 'call' && (
                    <TextField
                      size="small"
                      label="Teléfono (+1…)"
                      value={b.phoneNumber || ''}
                      onChange={(e) => setBtn(i, { phoneNumber: e.target.value })}
                      sx={{ minWidth: 180 }}
                    />
                  )}
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setButtons((btns) => btns.filter((_, idx) => idx !== i))}
                    aria-label="Quitar botón"
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              mt={1}
            >
              «Abrir ofertas» y «Mi lista» usan el short link único de cada cliente (trackea
              clicks) y abren en webview a todo el ancho del teléfono.
            </Typography>
          </Card>

          {/* Failover */}
          <Card
            variant="outlined"
            sx={{ p: 2.5 }}
          >
            <Typography
              variant="subtitle1"
              fontWeight={700}
              mb={0.5}
            >
              5 · SMS de respaldo
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              mb={1.5}
            >
              Se envía a los teléfonos que no soportan RCS. #linkrcs = short link del cliente.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={failover}
              onChange={(e) => setFailover(e.target.value.slice(0, 2047))}
              sx={{ '& .MuiInputBase-root': { fontFamily: 'monospace' } }}
            />
          </Card>

          {/* Submit */}
          <Box
            display="flex"
            justifyContent="flex-end"
            gap={2}
          >
            <Tooltip
              title={
                canSubmit
                  ? ''
                  : 'Falta: título, mínimo 2 productos y el SMS de respaldo'
              }
            >
              <span>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<SendRoundedIcon />}
                  disabled={!canSubmit || mutation.isPending}
                  onClick={() => setConfirmOpen(true)}
                  sx={{
                    px: 3,
                    background: `linear-gradient(120deg, ${RCS_PINK}, #a3009c)`,
                    '&:hover': { background: `linear-gradient(120deg, #c40062, #8b0085)` },
                  }}
                >
                  Crear campaña RCS
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Stack>

        {/* ── Preview teléfono ───────────────────────────────────────────── */}
        <Box
          position={{ md: 'sticky' }}
          top={16}
        >
          <Card
            sx={{
              borderRadius: 5,
              border: '10px solid #111',
              overflow: 'hidden',
              bgcolor: '#fff',
            }}
          >
            {/* header estilo Google Messages */}
            <Box
              px={2}
              py={1.2}
              display="flex"
              alignItems="center"
              gap={1.2}
              borderBottom="1px solid #eee"
            >
              <Avatar sx={{ width: 30, height: 30, bgcolor: RCS_PINK, fontSize: 14, fontWeight: 800 }}>
                S
              </Avatar>
              <Box lineHeight={1.1}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.5}
                >
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    color="#111"
                  >
                    Sweepstouch
                  </Typography>
                  <VerifiedRoundedIcon sx={{ fontSize: 14, color: '#1a73e8' }} />
                </Stack>
                <Typography
                  variant="caption"
                  color="#888"
                >
                  Mensaje RCS · {storeName}
                </Typography>
              </Box>
            </Box>

            {/* carrusel */}
            <Box
              p={1.5}
              sx={{ bgcolor: '#f6f7f9' }}
            >
              {cards.length === 0 ? (
                <Box
                  py={6}
                  textAlign="center"
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Elegí productos para ver el carrusel 👀
                  </Typography>
                </Box>
              ) : (
                <Box
                  display="flex"
                  gap={1.2}
                  overflow="auto"
                  pb={1}
                >
                  {cards.map((c) => (
                    <Box
                      key={c.productId}
                      flexShrink={0}
                      width={168}
                      bgcolor="#fff"
                      borderRadius={2.5}
                      overflow="hidden"
                      boxShadow="0 1px 4px rgba(0,0,0,0.12)"
                    >
                      <Box
                        height={110}
                        sx={{
                          bgcolor: '#f1f1f1',
                          backgroundImage: c.imageUrl ? `url(${c.imageUrl})` : undefined,
                          backgroundSize: 'contain',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                        }}
                      />
                      <Box p={1.2}>
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          color="#111"
                          display="-webkit-box"
                          sx={{
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {c.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="#777"
                          display="-webkit-box"
                          sx={{
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            fontSize: 10.5,
                          }}
                        >
                          {c.description}
                        </Typography>
                      </Box>
                      <Divider />
                      <Box
                        py={0.9}
                        textAlign="center"
                      >
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          color="#1a73e8"
                        >
                          {c.buttonText || 'Agregar'}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}

              {/* botones globales */}
              {buttons.filter((b) => b.text.trim()).length > 0 && (
                <Box
                  display="flex"
                  gap={0.8}
                  mt={1}
                  flexWrap="nowrap"
                  overflow="auto"
                  pb={0.5}
                >
                  {buttons
                    .filter((b) => b.text.trim())
                    .map((b, i) => (
                      <Chip
                        key={i}
                        label={b.text}
                        size="small"
                        sx={{
                          flexShrink: 0,
                          bgcolor: '#fff',
                          color: '#1a73e8',
                          fontWeight: 700,
                          border: '1px solid #dadce0',
                        }}
                      />
                    ))}
                </Box>
              )}
            </Box>
          </Card>

          <Alert
            icon={<CheckCircleRoundedIcon fontSize="small" />}
            severity="success"
            sx={{ mt: 1.5, bgcolor: alpha(RCS_PINK, 0.06), color: 'text.primary' }}
          >
            Cada botón abre la página RCS del cliente en <b>webview a pantalla completa</b> con
            su short link (clicks trackeados por campaña).
          </Alert>
        </Box>
      </Box>

      {/* Confirmación */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
      >
        <DialogTitle>Confirmar campaña RCS</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            «{title}» — carrusel de <b>{cards.length} productos</b> con{' '}
            {buttons.filter((b) => b.text.trim()).length} botones, para{' '}
            <b>{totalAudience.toLocaleString()} clientes</b> de {storeName}.
            <br />
            Envío: {startDate.toLocaleString()}. Sender: sweepstouch.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            color="secondary"
            onClick={() => setConfirmOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Creando…' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snack.sev}
          variant="filled"
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
