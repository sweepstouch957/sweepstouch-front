'use client';

import {
  campaignRequestService,
  CampaignRequest,
  CampaignProduct,
  STATUS_LABELS,
  STATUS_COLORS,
} from '@/services/campaign-request.service';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ImageIcon from '@mui/icons-material/Image';
import PersonIcon from '@mui/icons-material/Person';
import SendIcon from '@mui/icons-material/Send';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import StoreIcon from '@mui/icons-material/Store';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-HN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function formatMoney(n?: number) {
  if (n === undefined || n === null) return '—';
  return `$${Number(n).toFixed(2)}`;
}

/* ── Product Card ───────────────────────────────────────────── */
function ProductCard({ product }: { product: CampaignProduct }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      {product.imageUrl && (
        <CardMedia
          component="img"
          height="120"
          image={product.imageUrl}
          alt={product.name}
          sx={{ objectFit: 'cover' }}
        />
      )}
      {!product.imageUrl && (
        <Box sx={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
          <ShoppingCartIcon color="disabled" />
        </Box>
      )}
      <CardContent sx={{ p: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={700} noWrap>{product.name}</Typography>
        <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
          <Typography variant="h6" fontWeight={700} color="primary">
            {formatMoney(product.price)}{product.unit ? `/${product.unit}` : ''}
          </Typography>
          {product.originalPrice && (
            <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.disabled' }}>
              {formatMoney(product.originalPrice)}
            </Typography>
          )}
        </Stack>
        {product.discount && (
          <Chip label={product.discount} color="error" size="small" sx={{ mt: 0.5 }} />
        )}
        {product.description && (
          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>{product.description}</Typography>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Proposal Card ──────────────────────────────────────────── */
function ProposalCard({ proposal, index, onApprove, onReject, isApproved }: {
  proposal: CampaignRequest['proposals'][0];
  index: number;
  onApprove?: () => void;
  onReject?: () => void;
  isApproved: boolean;
}) {
  const statusColor = proposal.status === 'approved' ? 'success' : proposal.status === 'rejected' ? 'error' : 'default';

  return (
    <Card variant={isApproved ? 'elevation' : 'outlined'} sx={{ border: isApproved ? '2px solid' : undefined, borderColor: 'success.main' }}>
      {proposal.imageUrl && (
        <Box sx={{ position: 'relative' }}>
          <CardMedia
            component="img"
            height="260"
            image={proposal.imageUrl}
            alt={`Propuesta ${index + 1}`}
            sx={{ objectFit: 'contain', bgcolor: 'grey.50' }}
          />
          {isApproved && (
            <Chip
              icon={<CheckCircleIcon />}
              label="Aprobada"
              color="success"
              size="small"
              sx={{ position: 'absolute', top: 8, right: 8 }}
            />
          )}
          {proposal.isAIGenerated && (
            <Chip
              icon={<SmartToyIcon />}
              label="AI"
              color="info"
              size="small"
              sx={{ position: 'absolute', top: 8, left: 8 }}
            />
          )}
        </Box>
      )}
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle2" fontWeight={600}>Propuesta #{index + 1}</Typography>
          <Chip label={proposal.status === 'pending' ? 'Pendiente' : proposal.status === 'approved' ? 'Aprobada' : 'Rechazada'} color={statusColor} size="small" />
        </Stack>
        <Typography variant="caption" color="text.secondary" display="block">
          Enviada por: {proposal.sentByName ?? '—'} · {formatDate(proposal.sentAt)}
        </Typography>
        {proposal.feedback && (
          <Alert severity="warning" sx={{ mt: 1, py: 0.5 }}>
            <Typography variant="caption"><strong>Feedback:</strong> {proposal.feedback}</Typography>
          </Alert>
        )}
        {proposal.status === 'pending' && onApprove && onReject && (
          <Stack direction="row" spacing={1} mt={1.5}>
            <Button variant="contained" color="success" size="small" startIcon={<CheckCircleIcon />} onClick={onApprove} fullWidth>
              Aprobar
            </Button>
            <Button variant="outlined" color="error" size="small" startIcon={<EditIcon />} onClick={onReject} fullWidth>
              Cambios
            </Button>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Upload Proposal Dialog ─────────────────────────────────── */
function UploadProposalDialog({ open, onClose, onSubmit, loading }: {
  open: boolean;
  onClose: () => void;
  onSubmit: (imageUrl: string) => void;
  loading: boolean;
}) {
  const [url, setUrl] = useState('');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Enviar propuesta de diseño</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Sube la imagen a Cloudinary y pega aquí la URL pública. Se enviará al dueño de la tienda por WhatsApp.
        </Typography>
        <TextField
          fullWidth
          label="URL de la imagen (Cloudinary)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://res.cloudinary.com/..."
          multiline
          rows={2}
        />
        {url && (
          <Box mt={2} sx={{ borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
            <img src={url} alt="preview" style={{ width: '100%', maxHeight: 240, objectFit: 'contain' }} />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
          onClick={() => url && onSubmit(url)}
          disabled={!url || loading}
        >
          Enviar al cliente
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ── AI Brief Panel ─────────────────────────────────────────── */
function AIBriefPanel({ requestId }: { requestId: string }) {
  const [open, setOpen] = useState(false);
  const { data, isFetching, refetch } = useQuery({
    queryKey: ['ai-brief', requestId],
    queryFn: () => campaignRequestService.getAIBrief(requestId),
    enabled: false,
  });

  const handleGenerate = () => {
    setOpen(true);
    refetch();
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<AutoAwesomeIcon />}
        onClick={handleGenerate}
        size="small"
      >
        Generar brief con IA
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon color="primary" /> Brief de diseño generado por IA
        </DialogTitle>
        <DialogContent>
          {isFetching && (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          )}
          {data && (
            <Box>
              {data.brief && (
                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} mb={1.5}>Instrucciones de diseño</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Headline</Typography>
                      <Typography variant="body2" fontWeight={600}>{data.brief.headline}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Sub-headline</Typography>
                      <Typography variant="body2">{data.brief.subheadline}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Layout</Typography>
                      <Typography variant="body2">{data.brief.layout}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">CTA</Typography>
                      <Typography variant="body2">{data.brief.callToAction}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Paleta de colores</Typography>
                      <Stack direction="row" spacing={1} mt={0.5}>
                        {data.brief.colorScheme?.map((c) => (
                          <Tooltip key={c} title={c}>
                            <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: c, border: '1px solid', borderColor: 'divider' }} />
                          </Tooltip>
                        ))}
                      </Stack>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Notas para el diseñador</Typography>
                      <Typography variant="body2">{data.brief.designNotes}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              )}

              {data.products?.length > 0 && (
                <>
                  <Typography variant="subtitle1" fontWeight={700} mb={1.5}>Productos con imágenes</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 2 }}>
                    {data.products.map((p, i) => <ProductCard key={i} product={p} />)}
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/* ── Main Component ─────────────────────────────────────────── */
export default function RequestDetail({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { data: req, isLoading } = useQuery({
    queryKey: ['campaign-request', id],
    queryFn: () => campaignRequestService.getById(id),
  });

  const uploadMutation = useMutation({
    mutationFn: (imageUrl: string) => campaignRequestService.uploadProposal(id, { imageUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-request', id] });
      queryClient.invalidateQueries({ queryKey: ['campaign-requests-stats'] });
      setUploadOpen(false);
      setSnack({ open: true, message: 'Propuesta enviada al cliente por WhatsApp', severity: 'success' });
    },
    onError: () => setSnack({ open: true, message: 'Error al enviar propuesta', severity: 'error' }),
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (!req) {
    return (
      <Alert severity="error">Solicitud no encontrada</Alert>
    );
  }

  const latestProposalIdx = req.proposals.length - 1;

  return (
    <Box>
      {/* ── Header ── */}
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2} mb={3}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="h5" fontWeight={700}>{req.title ?? 'Sin título'}</Typography>
            <Chip
              label={STATUS_LABELS[req.status] ?? req.status}
              color={STATUS_COLORS[req.status] ?? 'default'}
              sx={{ fontWeight: 700 }}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            #{id.slice(-8).toUpperCase()} · Creado {formatDate(req.createdAt)}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <AIBriefPanel requestId={id} />
          <Button
            variant="contained"
            startIcon={<AddPhotoAlternateIcon />}
            onClick={() => setUploadOpen(true)}
            disabled={['approved', 'active', 'completed', 'cancelled'].includes(req.status)}
          >
            Enviar propuesta
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        {/* ── Left column ── */}
        <Grid item xs={12} md={4}>
          {/* Store info */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main' }}>
                  <StoreIcon />
                </Avatar>
                <Typography variant="subtitle1" fontWeight={700}>Información de la tienda</Typography>
              </Stack>
              <List dense disablePadding>
                <ListItem disableGutters>
                  <ListItemText primary="Tienda" secondary={req.storeName ?? req.storeSlug ?? '—'} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemText primary="Teléfono" secondary={req.storePhone ?? '—'} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemText primary="Diseñador asignado" secondary={req.assignedDesignerName ?? 'Sin asignar'} />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Campaign info */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: 'info.lighter', color: 'info.main' }}>
                  <CalendarMonthIcon />
                </Avatar>
                <Typography variant="subtitle1" fontWeight={700}>Detalles de la campaña</Typography>
              </Stack>
              <List dense disablePadding>
                <ListItem disableGutters>
                  <ListItemText primary="Inicio" secondary={formatDate(req.startDate)} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemText primary="Fin" secondary={formatDate(req.endDate)} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemText primary="Duración" secondary={req.durationDays ? `${req.durationDays} días` : '—'} />
                </ListItem>
                {req.specialNotes && (
                  <ListItem disableGutters>
                    <ListItemText primary="Notas especiales" secondary={req.specialNotes} secondaryTypographyProps={{ color: 'warning.main', fontWeight: 500 }} />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>

          {/* Change requests */}
          {req.changeRequests?.length > 0 && (
            <Card sx={{ border: '1px solid', borderColor: 'warning.main' }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                  <ErrorOutlineIcon color="warning" />
                  <Typography variant="subtitle2" fontWeight={700} color="warning.dark">
                    Cambios solicitados ({req.changeRequests.length})
                  </Typography>
                </Stack>
                {req.changeRequests.map((cr, i) => (
                  <Alert key={i} severity="warning" sx={{ mb: 1, py: 0.5 }}>
                    <Typography variant="caption" display="block" color="text.secondary">{formatDate(cr.requestedAt)}</Typography>
                    <Typography variant="body2">{cr.description}</Typography>
                    {cr.resolvedAt && (
                      <Typography variant="caption" color="success.main">Resuelto: {formatDate(cr.resolvedAt)}</Typography>
                    )}
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* ── Right column ── */}
        <Grid item xs={12} md={8}>
          {/* Approved design highlight */}
          {req.approvedImageUrl && (
            <Card sx={{ mb: 3, border: '2px solid', borderColor: 'success.main' }}>
              <CardContent sx={{ pb: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                  <CheckCircleIcon color="success" />
                  <Typography variant="subtitle1" fontWeight={700} color="success.dark">Diseño aprobado</Typography>
                </Stack>
                <img
                  src={req.approvedImageUrl}
                  alt="Diseño aprobado"
                  style={{ width: '100%', maxHeight: 360, objectFit: 'contain', borderRadius: 8, background: '#f5f5f5' }}
                />
              </CardContent>
            </Card>
          )}

          {/* Products */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" spacing={1} alignItems="center">
                <ShoppingCartIcon fontSize="small" />
                <Typography fontWeight={600}>Productos ({req.products?.length ?? 0})</Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              {(!req.products || req.products.length === 0) ? (
                <Typography color="text.secondary" variant="body2">Sin productos registrados</Typography>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 2 }}>
                  {req.products.map((p, i) => <ProductCard key={i} product={p} />)}
                </Box>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Proposals */}
          <Accordion defaultExpanded sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" spacing={1} alignItems="center">
                <ImageIcon fontSize="small" />
                <Typography fontWeight={600}>Propuestas de diseño ({req.proposals?.length ?? 0})</Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              {(!req.proposals || req.proposals.length === 0) ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <ImageIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                  <Typography color="text.secondary" mt={1}>Aún no se han enviado propuestas</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddPhotoAlternateIcon />}
                    onClick={() => setUploadOpen(true)}
                    sx={{ mt: 2 }}
                  >
                    Enviar primera propuesta
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
                  {req.proposals.map((p, i) => (
                    <ProposalCard
                      key={p._id ?? i}
                      proposal={p}
                      index={i}
                      isApproved={i === req.approvedProposalIndex}
                      onApprove={p.status === 'pending' ? () => {} : undefined}
                      onReject={p.status === 'pending' ? () => {} : undefined}
                    />
                  ))}
                </Box>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Previews sent */}
          {req.previewsSent?.length > 0 && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Notificaciones de preview enviadas</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Enviado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {req.previewsSent.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Chip label={p.type === '6h' ? '6 horas antes' : p.type === '1h' ? '1 hora antes' : 'Al momento'} size="small" color="info" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">{formatDate(p.sentAt)}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* ── Upload Dialog ── */}
      <UploadProposalDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSubmit={(url) => uploadMutation.mutate(url)}
        loading={uploadMutation.isPending}
      />

      {/* ── Snackbar ── */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snack.severity} variant="filled" sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
