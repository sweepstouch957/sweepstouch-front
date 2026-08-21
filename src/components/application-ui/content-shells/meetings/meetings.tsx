'use client';

import {
  useOtterActionItems,
  useOtterChannels,
  useOtterConversations,
  useOtterStatus,
  useOtterTranscript,
} from '@/hooks/fetching/otter/use-otter';
import {
  otterService,
  speakerName,
  unwrapList,
  type DigestAudience,
  type DigestResponse,
  type OtterConversation,
} from '@/services/otter.service';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  alpha,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  InputAdornment,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useDeferredValue, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useCustomization } from 'src/hooks/use-customization';
import { MeetingCard } from './meeting-card';
import { MeetingDetailDrawer } from './meeting-detail-drawer';
import { OtterStatusNotice } from './otter-status-notice';
import { digestToMarkdown } from './digest-markdown';

const PAGE_SIZE = 30;

/** Mensaje corto para el usuario a partir de un error de axios. */
function errorMessage(err: unknown): string | undefined {
  if (!err) return undefined;
  const anyErr = err as { response?: { data?: { message?: string } }; message?: string };
  return anyErr.response?.data?.message || anyErr.message || 'Error inesperado';
}

function Meetings(): React.JSX.Element {
  const theme = useTheme();
  const customization = useCustomization();
  const queryClient = useQueryClient();

  /* ── UI state ── */
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [channelId, setChannelId] = useState('');
  /** Otter pagina por cursor: guardamos el cursor de cada página visitada. */
  const [cursors, setCursors] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [audience, setAudience] = useState<DigestAudience>('po');
  const [digests, setDigests] = useState<Record<string, DigestResponse>>({});

  /* ── Queries ── */
  const status = useOtterStatus();
  const live = status.data?.ok === true;

  const channels = useOtterChannels(live);
  const conversations = useOtterConversations(
    { channelId: channelId || undefined, cursor: cursors[page - 1], limit: PAGE_SIZE },
    live
  );

  const meetings = useMemo(() => unwrapList(conversations.data), [conversations.data]);

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return meetings;
    return meetings.filter((m: OtterConversation) => {
      const haystack = [
        m.title,
        m.summary,
        ...(m.speakers || []).map(speakerName),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [meetings, deferredSearch]);

  const selected = useMemo(
    () => meetings.find((m: OtterConversation) => m.id === selectedId) || null,
    [meetings, selectedId]
  );

  const transcript = useOtterTranscript(selectedId, live);
  const actionItemsQuery = useOtterActionItems(selectedId, live);
  const actionItems = useMemo(() => unwrapList(actionItemsQuery.data), [actionItemsQuery.data]);

  /* ── Digest ── */
  const digestMutation = useMutation({
    mutationFn: ({ id, aud }: { id: string; aud: DigestAudience }) => otterService.digest(id, aud),
    onSuccess: (data, vars) => {
      setDigests((prev) => ({ ...prev, [vars.id]: data }));
      toast.success('Resumen generado');
    },
    onError: (err) => toast.error(errorMessage(err) || 'No se pudo generar el resumen'),
  });

  const handleGenerateDigest = useCallback(() => {
    if (!selectedId) return;
    digestMutation.mutate({ id: selectedId, aud: audience });
  }, [selectedId, audience, digestMutation]);

  const handleCopyDigest = useCallback(async () => {
    if (!selectedId || !selected) return;
    const current = digests[selectedId];
    if (!current) return;
    await navigator.clipboard.writeText(digestToMarkdown(selected, current));
    toast.success('Resumen copiado');
  }, [selectedId, selected, digests]);

  /* ── Paginación por cursor ── */
  const nextToken = conversations.data?.next_cursor ?? conversations.data?.cursor;
  const canNext = Boolean(nextToken) && filtered.length > 0;

  const goNext = useCallback(() => {
    if (!nextToken) return;
    setCursors((prev) => {
      const copy = [...prev];
      copy[page] = nextToken;
      return copy;
    });
    setPage((p) => p + 1);
  }, [nextToken, page]);

  const goPrev = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['otter'] });
  }, [queryClient]);

  const handleChannelChange = useCallback((value: string) => {
    setChannelId(value);
    setCursors([]);
    setPage(0);
  }, []);

  const listLoading = status.isLoading || (live && conversations.isLoading);

  return (
    <Container
      maxWidth={customization.stretch ? false : 'xl'}
      sx={{ py: { xs: 2, sm: 3 } }}
    >
      {/* ── Header ── */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ md: 'center' }}
        justifyContent="space-between"
        mb={3}
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.14),
              color: 'primary.main',
            }}
          >
            <EventNoteRoundedIcon />
          </Box>
          <Box>
            <Typography
              variant="h4"
              fontWeight={800}
            >
              Reuniones
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Dailies y calls grabadas en Otter, con resumen accionable para producto
            </Typography>
          </Box>
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
        >
          <Chip
            size="small"
            color={live ? 'success' : 'warning'}
            variant="outlined"
            label={live ? 'Otter conectado' : 'Otter sin datos'}
          />
          <Tooltip title="Refrescar">
            <IconButton onClick={handleRefresh}>
              <RefreshRoundedIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* ── Integración caída: no tiene sentido pintar filtros ni grilla ── */}
      {!status.isLoading && !live && (
        <OtterStatusNotice
          status={status.data}
          onRetry={handleRefresh}
          retrying={status.isFetching}
        />
      )}

      {live && (
        <>
          {/* ── Filtros ── */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            mb={2.5}
          >
            <TextField
              size="small"
              fullWidth
              placeholder="Buscar por título, resumen o participante"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              size="small"
              label="Canal"
              value={channelId}
              onChange={(e) => handleChannelChange(e.target.value)}
              sx={{ minWidth: { sm: 220 } }}
            >
              <MenuItem value="">Todos</MenuItem>
              {unwrapList(channels.data).map((c) => (
                <MenuItem
                  key={c.id}
                  value={c.id}
                >
                  {c.name || c.id}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {/* ── Grilla ── */}
          {listLoading && (
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  height={196}
                />
              ))}
            </Box>
          )}

          {!listLoading && conversations.isError && (
            <Typography
              variant="body2"
              color="error.main"
            >
              {errorMessage(conversations.error)}
            </Typography>
          )}

          {!listLoading && !conversations.isError && filtered.length === 0 && (
            <Stack
              spacing={1}
              alignItems="center"
              sx={{ py: 8 }}
            >
              <EventNoteRoundedIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
              <Typography
                variant="subtitle1"
                fontWeight={700}
              >
                No hay reuniones
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                {search ? 'Probá con otra búsqueda.' : 'Todavía no hay grabaciones en este canal.'}
              </Typography>
            </Stack>
          )}

          {!listLoading && filtered.length > 0 && (
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              }}
            >
              {filtered.map((m: OtterConversation) => (
                <MeetingCard
                  key={m.id}
                  meeting={m}
                  selected={m.id === selectedId}
                  onOpen={setSelectedId}
                />
              ))}
            </Box>
          )}

          {/* ── Paginación ── */}
          {(page > 0 || canNext) && (
            <Stack
              direction="row"
              spacing={1}
              justifyContent="center"
              mt={3}
            >
              <Button
                size="small"
                variant="outlined"
                startIcon={<ChevronLeftRoundedIcon />}
                disabled={page === 0}
                onClick={goPrev}
              >
                Anterior
              </Button>
              <Button
                size="small"
                variant="outlined"
                endIcon={<ChevronRightRoundedIcon />}
                disabled={!canNext}
                onClick={goNext}
              >
                Siguiente
              </Button>
            </Stack>
          )}
        </>
      )}

      <MeetingDetailDrawer
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        meeting={selected}
        transcript={transcript.data}
        transcriptLoading={transcript.isLoading}
        transcriptError={transcript.isError ? errorMessage(transcript.error) : undefined}
        actionItems={actionItems}
        actionItemsLoading={actionItemsQuery.isLoading}
        digest={selectedId ? digests[selectedId] : undefined}
        digestLoading={digestMutation.isPending}
        digestError={digestMutation.isError ? errorMessage(digestMutation.error) : undefined}
        audience={audience}
        onAudienceChange={setAudience}
        onGenerateDigest={handleGenerateDigest}
        onCopyDigest={handleCopyDigest}
      />
    </Container>
  );
}

export default Meetings;
