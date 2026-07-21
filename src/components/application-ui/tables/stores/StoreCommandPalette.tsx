'use client';

/**
 * StoreCommandPalette — Command-K style AI-powered store search.
 *
 * Triggers: Ctrl+K / Cmd+K  or  click the search pill in the filter bar.
 * Uses /store/ai/search for relevance-ranked results.
 * Falls back gracefully to empty state.
 */

import React, {
  FC, useCallback, useEffect, useRef, useState } from 'react';
import {
  alpha, Avatar, Box, Chip, CircularProgress, Dialog, Divider,
  IconButton, InputAdornment, Stack, TextField, Tooltip, Typography, useTheme,
} from '@mui/material';
import {
  AutoAwesome, Close, KeyboardReturn,
  SearchRounded, StoreRounded } from '@mui/icons-material';
import Link from 'next/link';
import { api } from '@/libs/axios';
import { Store } from '@/services/store.service';

/* ─── local debounce hook ─────────────────────────────────────────────────── */
function useDebounce(value: string, ms: number): [string] {
  const [debounced, setDebounced] = React.useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return [debounced];
}

/* ─── Types ─────────────────────────────────────────────────────────────────── */
interface AIResult extends Partial<Store> {
  _snippet?: string;
  _score?: number;
}

/* ─── Mini API call ─────────────────────────────────────────────────────────── */
async function aiSearch(q: string, signal: AbortSignal): Promise<AIResult[]> {
  const res = await api.get('/store/ai/search', {
    params: { q, limit: 12, score: '1' },
    signal,
  });
  return res.data?.data ?? [];
}

/* ─── Highlight match ───────────────────────────────────────────────────────── */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(re);
  return (
    <>
      {parts.map((part, i) =>
        re.test(part)
          ? <Box key={i} component="mark" sx={{ bgcolor: 'warning.main', color: 'warning.contrastText', borderRadius: 0.5, px: 0.2 }}>{part}</Box>
          : part
      )}
    </>
  );
}

/* ─── Result row ─────────────────────────────────────────────────────────────── */
const ResultRow: FC<{
  store: AIResult; query: string; active: boolean; onClick: () => void;
}> = React.memo(({ store, query, active, onClick }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const id = store._id || store.id;
  const name = store.name ?? '';
  const snippet = store._snippet ?? store.address ?? '';

  return (
    <Link
      href={`/admin/management/stores/edit/${id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
      onClick={onClick}
    >
      <Box
        sx={{
          display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.1,
          borderRadius: 2,
          bgcolor: active
            ? isDark ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.primary.main, 0.06)
            : 'transparent',
          border: `1px solid ${active ? alpha(theme.palette.primary.main, 0.25) : 'transparent'}`,
          cursor: 'pointer',
          transition: 'background 0.12s, border-color 0.12s',
          '&:hover': {
            bgcolor: isDark ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.primary.main, 0.05),
            borderColor: alpha(theme.palette.primary.main, 0.2),
          },
          mx: 0.75,
        }}
      >
        {/* Logo / Avatar */}
        <Avatar
          src={store.image ?? ''}
          variant="rounded"
          sx={{
            width: 36, height: 36, borderRadius: 1.5, flexShrink: 0,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            fontSize: 13, fontWeight: 800, color: 'primary.main',
          }}
        >
          <StoreRounded sx={{ fontSize: 18 }} />
        </Avatar>

        {/* Text */}
        <Box flex={1} minWidth={0}>
          <Typography fontSize={13} fontWeight={700} noWrap>
            <Highlight text={name} query={query} />
          </Typography>
          {snippet && (
            <Typography fontSize={11} color="text.secondary" noWrap>
              <Highlight text={snippet} query={query} />
            </Typography>
          )}
        </Box>

        {/* Right badges */}
        <Stack direction="row" spacing={0.5} alignItems="center" flexShrink={0}>
          {store.active !== undefined && (
            <Box sx={{
              width: 7, height: 7, borderRadius: '50%',
              bgcolor: store.active ? 'success.main' : 'text.disabled',
            }} />
          )}
          {store.customerCount !== undefined && (
            <Chip
              size="small"
              label={store.customerCount}
              sx={{ height: 18, fontSize: 10, fontWeight: 700, '& .MuiChip-label': { px: 0.5 } }}
            />
          )}
          {active && (
            <KeyboardReturn sx={{ fontSize: 13, color: 'text.disabled' }} />
          )}
        </Stack>
      </Box>
    </Link>
  );
});
ResultRow.displayName = 'ResultRow';

/* ─── Main Component ─────────────────────────────────────────────────────────── */
interface Props {
  open: boolean;
  onClose: () => void;
  /** Optional: sync back the selected query to the filter bar */
  onSelectSearch?: (q: string) => void;
}

export const StoreCommandPalette: FC<Props> = ({ open, onClose, onSelectSearch }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 220);
  const [results, setResults] = useState<AIResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  /* Focus input when opens */
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => inputRef.current?.focus(), 60);
    setQuery('');
    setResults([]);
    setActiveIdx(0);
    return () => clearTimeout(id);
  }, [open]);

  /* Fetch from AI search endpoint */
  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    aiSearch(debouncedQuery, abortRef.current.signal)
      .then((data) => { setResults(data); setActiveIdx(0); })
      .catch(() => {/* aborted */})
      .finally(() => setLoading(false));
    return () => abortRef.current?.abort();
  }, [debouncedQuery]);

  /* Keyboard nav */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter') {
      const s = results[activeIdx];
      const id = s?._id || (s as any)?.id;
      if (id) {
        onSelectSearch?.(query);
        onClose();
        // Navigate programmatically (Link won't trigger here)
        window.location.href = `/admin/management/stores/edit/${id}`;
      }
    }
    if (e.key === 'Escape') onClose();
  }, [results, activeIdx, query, onClose, onSelectSearch]);

  const handleClose = useCallback(() => {
    abortRef.current?.abort();
    onClose();
  }, [onClose]);

  const handleSelectStore = useCallback(() => {
    onSelectSearch?.(query);
    onClose();
  }, [query, onClose, onSelectSearch]);

  const isEmpty = !loading && query.trim().length > 1 && results.length === 0;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      TransitionProps={{ timeout: 150 }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          background: isDark
            ? `linear-gradient(160deg, ${alpha(theme.palette.background.default, 0.98)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`
            : theme.palette.background.paper,
          backdropFilter: 'blur(20px)',
          boxShadow: `0 24px 80px ${alpha(theme.palette.common.black, isDark ? 0.5 : 0.15)}, 0 0 0 1px ${alpha(theme.palette.primary.main, 0.1)}`,
          mt: { xs: '5vh', sm: '12vh' },
          alignSelf: 'flex-start',
          mx: { xs: 1.5, sm: 'auto' },
        },
      }}
      sx={{ '& .MuiBackdrop-root': { backdropFilter: 'blur(4px)', bgcolor: alpha(theme.palette.common.black, 0.4) } }}
    >
      {/* Search input */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.5,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
      }}>
        {loading
          ? <CircularProgress size={18} sx={{ flexShrink: 0 }} />
          : <SearchRounded sx={{ fontSize: 20, color: 'text.secondary', flexShrink: 0 }} />
        }
        <TextField
          inputRef={inputRef}
          fullWidth
          variant="standard"
          placeholder="Buscar tienda por nombre, dirección, código..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          InputProps={{
            disableUnderline: true,
            sx: { fontSize: 15, fontWeight: 500 },
            endAdornment: query ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setQuery('')} sx={{ p: 0.25 }}>
                  <Close sx={{ fontSize: 14 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
        <Tooltip title="AI Search — busca por nombre, dirección, código">
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 0.35, px: 0.75, py: 0.25,
            borderRadius: 1, bgcolor: alpha(theme.palette.primary.main, 0.1),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            flexShrink: 0,
          }}>
            <AutoAwesome sx={{ fontSize: 11, color: 'primary.main' }} />
            <Typography fontSize={10} fontWeight={700} color="primary.main">AI</Typography>
          </Box>
        </Tooltip>
        <Tooltip title="Cerrar (Esc)">
          <IconButton size="small" onClick={handleClose} sx={{ flexShrink: 0, p: 0.5 }}>
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Results */}
      <Box sx={{ maxHeight: '60vh', overflowY: 'auto', py: 0.75,
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-thumb': { bgcolor: alpha(theme.palette.text.primary, 0.1), borderRadius: 2 },
      }}>
        {/* Empty query hint */}
        {!query.trim() && (
          <Box sx={{ px: 3, py: 3, textAlign: 'center' }}>
            <SearchRounded sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
            <Typography fontSize={13} color="text.secondary">
              Escribe para buscar tiendas...
            </Typography>
            <Typography fontSize={11} color="text.disabled" mt={0.5}>
              Busca por nombre, dirección, ciudad o código de acceso
            </Typography>
          </Box>
        )}

        {/* Short query */}
        {query.trim().length === 1 && (
          <Box sx={{ px: 3, py: 2, textAlign: 'center' }}>
            <Typography fontSize={12} color="text.disabled">Escribe al menos 2 caracteres...</Typography>
          </Box>
        )}

        {/* Loading skeleton */}
        {loading && query.trim().length > 1 && (
          <Box sx={{ px: 2, py: 1.5 }}>
            {[1, 2, 3].map(i => (
              <Box key={i} sx={{
                height: 52, borderRadius: 2, mb: 0.75,
                bgcolor: alpha(theme.palette.text.primary, 0.04),
                animation: 'pulse 1.5s infinite',
                '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
              }} />
            ))}
          </Box>
        )}

        {/* Results list */}
        {!loading && results.length > 0 && (
          <Box>
            <Typography fontSize={10} fontWeight={700} color="text.disabled"
              sx={{ px: 2.75, py: 0.5, letterSpacing: '0.08em' }}>
              {results.length} RESULTADOS
            </Typography>
            <Stack spacing={0.25}>
              {results.map((store, i) => (
                <ResultRow
                  key={store._id || (store as any).id || i}
                  store={store}
                  query={debouncedQuery}
                  active={i === activeIdx}
                  onClick={handleSelectStore}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Empty state */}
        {isEmpty && (
          <Box sx={{ px: 3, py: 4, textAlign: 'center' }}>
            <StoreRounded sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
            <Typography fontSize={13} color="text.secondary" fontWeight={600}>
              Sin resultados para "{query}"
            </Typography>
            <Typography fontSize={11} color="text.disabled" mt={0.5}>
              Intenta con el nombre, dirección o código de acceso
            </Typography>
          </Box>
        )}
      </Box>

      {/* Footer */}
      <Divider />
      <Stack direction="row" alignItems="center" justifyContent="space-between"
        sx={{ px: 2, py: 0.75, bgcolor: isDark ? alpha('#000', 0.2) : alpha(theme.palette.grey[100], 0.5) }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          {[
            { key: '↑↓', label: 'navegar' },
            { key: '↵', label: 'abrir' },
            { key: 'Esc', label: 'cerrar' },
          ].map(({ key, label }) => (
            <Stack key={key} direction="row" alignItems="center" spacing={0.4}>
              <Box sx={{
                px: 0.6, py: 0.1, borderRadius: 0.75, border: `1px solid ${alpha(theme.palette.text.primary, 0.15)}`,
                bgcolor: alpha(theme.palette.text.primary, 0.05), fontSize: 10, fontWeight: 700, color: 'text.secondary',
              }}>{key}</Box>
              <Typography fontSize={10} color="text.disabled">{label}</Typography>
            </Stack>
          ))}
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.4}>
          <AutoAwesome sx={{ fontSize: 11, color: alpha(theme.palette.primary.main, 0.6) }} />
          <Typography fontSize={10} color="text.disabled">Potenciado por AI</Typography>
        </Stack>
      </Stack>
    </Dialog>
  );
};

/* ─── Ctrl+K global trigger hook ─────────────────────────────────────────────── */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  const openPalette  = useCallback(() => setOpen(true), []);
  const closePalette = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return { open, openPalette, closePalette };
}
