'use client';

import { promoterService } from '@/services/promotor.service';
import { shiftService } from '@/services/shift.service';
import { getAllStores, Store } from '@/services/store.service';
import { sweepstakesClient } from '@/services/sweepstakes.service';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import SearchIcon from '@mui/icons-material/Search';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  Divider,
  IconButton,
  Snackbar,
  Stack,
  TextField,
  Typography } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import Autocomplete from '@mui/material/Autocomplete';
import { MobileDatePicker, TimePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useReducer, useState, useRef } from 'react';
import { usePromotersNearStore } from '@/hooks/fetching/promoter/usePromotersNearStore';
import { tint, tintBorder } from '@/theme/semantic';

// ── Types ─────────────────────────────────────────────────────────────────────

type PromoterOption = {
  _id: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  rating?: number;
  distanceMiles?: number;
};

type ShiftState = {
  selectedStore: Store | null;
  date: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  notes: string;
  selectedPromoter: PromoterOption | null;
  snackbar: { open: boolean; message: string; severity: 'success' | 'error' };
};

type ShiftAction =
  | { type: 'LOAD_SHIFT'; shift: any; stores: Store[] }
  | { type: 'RESET' }
  | { type: 'SET_STORE'; value: Store | null }
  | { type: 'SET_DATE'; value: Date | null }
  | { type: 'SET_START_TIME'; value: Date | null }
  | { type: 'SET_END_TIME'; value: Date | null }
  | { type: 'SET_NOTES'; value: string }
  | { type: 'SET_PROMOTER'; value: PromoterOption | null }
  | { type: 'SNACKBAR'; message: string; severity: 'success' | 'error' }
  | { type: 'CLOSE_SNACKBAR' };

// ── Helpers ───────────────────────────────────────────────────────────────────

function defaultEnd(from?: Date | null): Date {
  const end = new Date(from ?? new Date());
  end.setHours(end.getHours() + 4);
  return end;
}

function fmtDuration(start: Date | null, end: Date | null): string {
  if (!start || !end) return '';
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return '';
  const h = Math.floor(diffMs / 3_600_000);
  const m = Math.round((diffMs % 3_600_000) / 60_000);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const PLACEHOLDER_IMG =
  'https://res.cloudinary.com/proyectos-personales/image/upload/v1679455472/woocommerce-placeholder-600x600_xo2kmv.png';

// ── Reducer ───────────────────────────────────────────────────────────────────

const INITIAL: ShiftState = {
  selectedStore: null,
  date: new Date(),
  startTime: new Date(),
  endTime: defaultEnd(),
  notes: '',
  selectedPromoter: null,
  snackbar: { open: false, message: '', severity: 'success' },
};

function shiftReducer(state: ShiftState, action: ShiftAction): ShiftState {
  switch (action.type) {
    case 'LOAD_SHIFT': {
      const s = action.shift;
      const start = new Date(s.startTime);
      const store =
        action.stores.find((st) => st._id === s.storeId) ??
        (s.storeInfo ?? null);
      return {
        ...state,
        date: new Date(s.date),
        startTime: start,
        endTime: new Date(s.endTime ?? defaultEnd(start)),
        notes: s.notes || '',
        selectedStore: store,
        selectedPromoter: null,
      };
    }
    case 'RESET':
      return { ...INITIAL, date: new Date(), startTime: new Date(), endTime: defaultEnd() };
    case 'SET_STORE':
      return { ...state, selectedStore: action.value };
    case 'SET_DATE':
      return { ...state, date: action.value };
    case 'SET_START_TIME': {
      const end = action.value ? defaultEnd(action.value) : state.endTime;
      return { ...state, startTime: action.value, endTime: end };
    }
    case 'SET_END_TIME':
      return { ...state, endTime: action.value };
    case 'SET_NOTES':
      return { ...state, notes: action.value };
    case 'SET_PROMOTER':
      return { ...state, selectedPromoter: action.value };
    case 'SNACKBAR':
      return { ...state, snackbar: { open: true, message: action.message, severity: action.severity } };
    case 'CLOSE_SNACKBAR':
      return { ...state, snackbar: { ...state.snackbar, open: false } };
    default:
      return state;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface RadiusInputProps {
  radiusKm: number;
  onRadiusChange: (v: number) => void;
}

function RadiusInput({ radiusKm, onRadiusChange }: RadiusInputProps) {
  const milesVal = Math.round(radiusKm / 1.6);
  const [isLocked, setIsLocked] = useState(true);
  const [localVal, setLocalVal] = useState(String(milesVal));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalVal(String(milesVal));
  }, [milesVal]);

  const commitValue = () => {
    const parsed = parseFloat(localVal);
    if (!isNaN(parsed) && parsed > 0) {
      onRadiusChange(parsed * 1.6);
    } else {
      setLocalVal(String(milesVal));
    }
  };

  const handleToggleLock = () => {
    if (isLocked) {
      setIsLocked(false);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    } else {
      commitValue();
      setIsLocked(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      commitValue();
      setIsLocked(true);
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setLocalVal(String(milesVal));
      setIsLocked(true);
      inputRef.current?.blur();
    }
  };

  const handleBlur = () => {
    commitValue();
    setIsLocked(true);
  };

  return (
    <Stack direction="row" alignItems="center" gap={0.5}>
      <TextField
        inputRef={inputRef}
        size="small"
        type="number"
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        InputProps={{
          readOnly: isLocked,
        }}
        sx={{
          width: 42,
          '& .MuiOutlinedInput-root': {
            height: 24,
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: 700,
            bgcolor: isLocked ? 'action.hover' : 'background.paper',
            transition: 'all 0.2s ease-in-out',
            p: 0,
            '& fieldset': {
              borderColor: (t) => (isLocked ? t.palette.divider : tintBorder(t, 'primary', 0.4)),
              transition: 'border-color 0.2s',
            },
            '&:hover fieldset': {
              borderColor: (t) => (isLocked ? t.palette.divider : t.palette.primary.main),
            },
            '&.Mui-focused fieldset': {
              borderColor: 'primary.main',
              borderWidth: '1px',
            },
            '& input': {
              textAlign: 'center',
              p: 0,
            },
            '& input[type=number]': {
              MozAppearance: 'textfield',
            },
            '& input[type=number]::-webkit-outer-spin-button': {
              WebkitAppearance: 'none',
              margin: 0,
            },
            '& input[type=number]::-webkit-inner-spin-button': {
              WebkitAppearance: 'none',
              margin: 0,
            },
          },
        }}
      />
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', ml: 0.25 }}>
        mi
      </Typography>
      <IconButton
        size="small"
        onClick={handleToggleLock}
        sx={{
          color: isLocked ? 'text.disabled' : 'primary.main',
          p: 0.25,
          transition: 'all 0.2s',
          '&:hover': {
            color: isLocked ? 'text.primary' : 'primary.dark',
            transform: 'scale(1.1)',
          },
        }}
      >
        {isLocked ? (
          <LockIcon sx={{ fontSize: 14 }} />
        ) : (
          <LockOpenIcon sx={{ fontSize: 14 }} />
        )}
      </IconButton>
    </Stack>
  );
}

export interface NewShiftModalProps {
  open: boolean;
  onClose: () => void;
  shiftId?: string | null;
  initialStoreId?: string | null;
  initialPromoterId?: string | null;
}

const NewShiftModal = ({ open, onClose, shiftId, initialStoreId, initialPromoterId }: NewShiftModalProps) => {
  const [state, dispatch] = useReducer(shiftReducer, INITIAL);
  const { selectedStore, date, startTime, endTime, notes, selectedPromoter, snackbar } = state;
  const queryClient = useQueryClient();
  const [radiusKm, setRadiusKm] = useState(8); // 8 km = 5 miles default

  const { data: nearPromotersData } = usePromotersNearStore(
    selectedStore?._id,
    radiusKm,
  );

  const recommendedPromoters = useMemo(() => {
    if (!nearPromotersData?.promoters || nearPromotersData.promoters.length === 0) return [];

    return nearPromotersData.promoters
      .map((p) => {
        // Distance score: 1 means close to 0 miles, 0 means >= radiusMiles
        const radiusMiles = radiusKm / 1.60934;
        const distMi = p.distanceMiles ?? radiusMiles;
        const normalizedDistance = Math.max(0, 1 - distMi / radiusMiles); // 0 to 1
        
        // Rating score: normalized out of 5
        const normalizedRating = (p.rating ?? 3.5) / 5;

        // Experience score: normalized out of 20 registrations (cap at 20)
        const normalizedExperience = Math.min(20, p.totalRegistrations ?? 0) / 20;

        // Smart scoring: 50% distance, 30% rating, 20% experience
        const aiScore = normalizedDistance * 0.5 + normalizedRating * 0.3 + normalizedExperience * 0.2;

        return {
          ...p,
          aiScore,
        };
      })
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, 3);
  }, [nearPromotersData?.promoters, radiusKm]);

  // All stores — no inline default; undefined = loading, data = stable reference
  const { data: allStores } = useQuery({
    queryKey: ['all-stores-shift-modal'],
    queryFn: getAllStores,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  // Active sweepstake for selected store
  const {
    data: activeSweepstake,
    isLoading: loadingSweepstake,
  } = useQuery({
    queryKey: ['active-sweepstake-for-store', selectedStore?._id],
    queryFn: () => sweepstakesClient.getSweepstakeByStoreId(selectedStore!._id),
    enabled: !!selectedStore?._id,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  // Promoters
  const { data: promotersData } = useQuery({
    queryKey: ['promoters-for-shift-modal'],
    queryFn: () => promoterService.getAllPromoters({ limit: 200 }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
  // Stable reference — .map() inside useMemo avoids new array on every render
  const promoterOptions = useMemo<PromoterOption[]>(
    () => {
      const nearMap = new Map<string, number>();
      for (const np of nearPromotersData?.promoters ?? []) {
        if (np.distanceMiles !== undefined) {
          nearMap.set(np._id, np.distanceMiles);
        }
      }

      return (promotersData?.data ?? [])
        .map((p) => {
          const dist = nearMap.get(p._id);
          return {
            _id: p._id,
            firstName: p.firstName,
            lastName: p.lastName,
            profileImage: p.profileImage,
            rating: p.rating,
            distanceMiles: dist,
          };
        })
        .sort((a, b) => {
          if (a.distanceMiles !== undefined && b.distanceMiles !== undefined) {
            return a.distanceMiles - b.distanceMiles;
          }
          if (a.distanceMiles !== undefined) return -1;
          if (b.distanceMiles !== undefined) return 1;
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        });
    },
    [promotersData?.data, nearPromotersData?.promoters],
  );

  // Existing shift (edit mode)
  const { data: existingShift } = useQuery({
    queryKey: ['shift-by-id', shiftId],
    queryFn: () => (shiftId ? shiftService.getShiftById(shiftId) : null),
    enabled: !!shiftId,
  });

  useEffect(() => {
    if (!allStores) return;
    if (existingShift?.shift) {
      dispatch({ type: 'LOAD_SHIFT', shift: existingShift.shift, stores: allStores });
    } else if (!shiftId) {
      dispatch({ type: 'RESET' });
      if (initialStoreId) {
        const store = allStores.find((s) => s._id === initialStoreId) ?? null;
        if (store) dispatch({ type: 'SET_STORE', value: store });
      }
    }
  }, [existingShift, shiftId, allStores, initialStoreId]);

  // Resolve promoter: edit mode OR pre-fill from initialPromoterId
  useEffect(() => {
    if (promoterOptions.length === 0) return;
    if (shiftId) {
      const pid = existingShift?.shift?.promoterId;
      if (!pid) return;
      const found = promoterOptions.find((p) => p._id === pid);
      if (found) dispatch({ type: 'SET_PROMOTER', value: found });
    } else if (initialPromoterId) {
      const found = promoterOptions.find((p) => p._id === initialPromoterId);
      if (found) dispatch({ type: 'SET_PROMOTER', value: found });
    }
  }, [existingShift?.shift?.promoterId, initialPromoterId, promoterOptions, shiftId]);

  const { mutate: saveShift, isPending: saving } = useMutation({
    mutationFn: async () => {
      const payload: any = {
        date,
        startTime,
        endTime,
        notes,
        storeId: selectedStore?._id,
        sweepstakeId: (activeSweepstake as any)?._id ?? (activeSweepstake as any)?.id,
        ...(selectedPromoter ? { promoterId: selectedPromoter._id } : {}),
      };
      return shiftId
        ? shiftService.updateShift(shiftId, payload)
        : shiftService.createShift(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift-metrics'] });
      dispatch({
        type: 'SNACKBAR',
        message: shiftId ? 'Turno actualizado' : 'Turno creado',
        severity: 'success',
      });
      onClose();
    },
    onError: () => {
      dispatch({ type: 'SNACKBAR', message: 'Error al guardar turno', severity: 'error' });
    },
  });

  const canSave = !!selectedStore && !!date && !!startTime && !saving;
  const duration = fmtDuration(startTime, endTime);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 3 },
            mx: { xs: 0, sm: 2 },
            my: { xs: 0, sm: 4 },
            height: { xs: '100dvh', sm: 'auto' },
            maxHeight: { xs: '100dvh', sm: '92vh' },
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            px: 3,
            pt: 3,
            pb: 2,
          }}
        >
          <Box>
            <Typography
              variant="h6"
              fontWeight={700}
              lineHeight={1.2}
            >
              {shiftId ? 'Editar Turno' : 'Nuevo Turno'}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              {shiftId ? 'Modifica los datos del turno' : 'Asigna una tienda y horario'}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: 'text.secondary', mt: -0.5 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Scrollable body */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 3,
            pb: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
          }}
        >
          {/* Store selector */}
          <Box>
            <SectionLabel>Tienda</SectionLabel>
            <Autocomplete
              options={allStores ?? []}
              getOptionLabel={(o) => o.name}
              value={selectedStore}
              onChange={(_, val) => dispatch({ type: 'SET_STORE', value: val })}
              isOptionEqualToValue={(a, b) => a._id === b._id}
              renderOption={({ key, ...props }, option) => (
                <Box
                  key={key}
                  component="li"
                  {...props}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}
                >
                  <Avatar
                    src={option.image || PLACEHOLDER_IMG}
                    alt={option.name}
                    sx={{ width: 32, height: 32 }}
                  />
                  <Box
                    flex={1}
                    minWidth={0}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={500}
                      noWrap
                    >
                      {option.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {(option.customerCount || 0).toLocaleString()} clientes
                    </Typography>
                  </Box>
                  {!option.active && (
                    <Chip
                      label="Inactiva"
                      size="small"
                      variant="outlined"
                      color="error"
                      sx={{ fontSize: 10 }}
                    />
                  )}
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Buscar tienda..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        {selectedStore ? (
                          <Avatar
                            src={selectedStore.image || PLACEHOLDER_IMG}
                            sx={{ width: 22, height: 22, mr: 0.5, flexShrink: 0 }}
                          />
                        ) : (
                          <SearchIcon
                            fontSize="small"
                            sx={{ color: 'text.disabled', mr: 0.5 }}
                          />
                        )}
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Box>

          {/* Store info card */}
          {selectedStore && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'action.hover',
                border: (t) => `1px solid ${t.palette.divider}`,
                display: 'flex',
                gap: 2,
                alignItems: 'flex-start',
              }}
            >
              <Avatar
                src={selectedStore.image || PLACEHOLDER_IMG}
                alt={selectedStore.name}
                variant="rounded"
                sx={{ width: 48, height: 48, borderRadius: 1.5, flexShrink: 0 }}
              />
              <Box
                flex={1}
                minWidth={0}
              >
                <Typography
                  variant="body2"
                  fontWeight={600}
                  noWrap
                >
                  {selectedStore.name}
                </Typography>

                <Box
                  display="flex"
                  alignItems="center"
                  gap={0.75}
                  mt={0.5}
                  flexWrap="wrap"
                >
                  <PeopleAltOutlinedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    <b>{(selectedStore.customerCount || 0).toLocaleString()}</b> clientes
                  </Typography>
                  <Chip
                    size="small"
                    label={selectedStore.active ? 'Activa' : 'Inactiva'}
                    color={selectedStore.active ? 'success' : 'default'}
                    variant={selectedStore.active ? 'filled' : 'outlined'}
                    sx={{ height: 18, fontSize: 10 }}
                  />
                </Box>

                <Divider sx={{ my: 1 }} />

                {loadingSweepstake ? (
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={1}
                  >
                    <CircularProgress size={11} />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      Buscando sorteo activo...
                    </Typography>
                  </Box>
                ) : activeSweepstake ? (
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={0.75}
                    flexWrap="wrap"
                  >
                    <EmojiEventsOutlinedIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                    <Typography
                      variant="caption"
                      fontWeight={500}
                    >
                      {(activeSweepstake as any).name}
                    </Typography>
                    <Chip
                      size="small"
                      label="Activo"
                      color="warning"
                      variant="outlined"
                      sx={{ height: 18, fontSize: 10 }}
                    />
                  </Box>
                ) : (
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={0.75}
                  >
                    <EmojiEventsOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      Sin sorteo activo
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* Date + time */}
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1,
              }}
            >
              <SectionLabel sx={{ mb: 0 }}>Horario</SectionLabel>
              {duration && (
                <Chip
                  size="small"
                  label={duration}
                  sx={{
                    height: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                  }}
                />
              )}
            </Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', sm: '1.2fr 1fr 1fr' },
                gap: 1.5,
              }}
            >
              <Box sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' } }}>
                <MobileDatePicker
                  label="Fecha"
                  value={date}
                  onChange={(val) => dispatch({ type: 'SET_DATE', value: val })}
                  slotProps={{
                    textField: { fullWidth: true, variant: 'outlined', size: 'small' },
                  }}
                />
              </Box>
              <TimePicker
                label="Inicio"
                value={startTime}
                onChange={(val) => {
                  if (val) dispatch({ type: 'SET_START_TIME', value: val });
                }}
                slotProps={{ textField: { fullWidth: true, variant: 'outlined', size: 'small' } }}
              />
              <TimePicker
                label="Fin"
                value={endTime}
                onChange={(val) => dispatch({ type: 'SET_END_TIME', value: val })}
                slotProps={{ textField: { fullWidth: true, variant: 'outlined', size: 'small' } }}
              />
            </Box>
          </Box>

          {/* Promoter */}
          <Box>
            <SectionLabel>
              Promotora{' '}
              <Typography
                component="span"
                variant="caption"
                color="text.disabled"
                fontWeight={400}
                sx={{ textTransform: 'none', letterSpacing: 0 }}
              >
                (opcional)
              </Typography>
            </SectionLabel>

            {selectedStore && (
              <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ fontSize: 9 }}>
                  RADIO:
                </Typography>
                <RadiusInput radiusKm={radiusKm} onRadiusChange={setRadiusKm} />
              </Box>
            )}

            {selectedStore && recommendedPromoters.length > 0 && (
              <Box
                sx={{
                  mb: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: (t) => tint(t, 'primary', 0.04),
                  border: '1px dashed',
                  borderColor: (t) => tintBorder(t, 'primary'),
                }}
              >
                <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 700, color: 'primary.main', display: 'block', mb: 1 }}>
                  ✨ RECOMENDACIÓN DE IA
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: 1,
                  }}
                >
                  {recommendedPromoters.map((p) => {
                    const matchPercent = Math.round(p.aiScore * 100);
                    const isSelected = selectedPromoter?._id === p._id;
                    const displayPromoter = {
                      _id: p._id,
                      firstName: p.firstName,
                      lastName: p.lastName,
                      profileImage: p.profileImage,
                      rating: p.rating,
                    };
                    return (
                      <Box
                        key={p._id}
                        onClick={() => dispatch({ type: 'SET_PROMOTER', value: displayPromoter })}
                        sx={{
                          p: 1,
                          borderRadius: 1.5,
                          bgcolor: (t) => (isSelected ? tint(t, 'primary', 0.08) : t.palette.background.paper),
                          border: '1px solid',
                          borderColor: isSelected ? 'primary.main' : 'divider',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: (t) => tint(t, 'primary', 0.08),
                          },
                        }}
                      >
                        <Avatar
                          src={p.profileImage}
                          alt={p.firstName}
                          sx={{ width: 28, height: 28, mx: 'auto', mb: 0.5 }}
                        />
                        <Typography variant="caption" fontWeight={600} noWrap display="block" sx={{ fontSize: 10, lineHeight: 1.1 }}>
                          {p.firstName}
                        </Typography>
                        
                        <Stack direction="row" justifyContent="center" alignItems="center" spacing={0.5} mt={0.25}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
                            {p.distanceMiles?.toFixed(1)} mi
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9 }}>
                            •
                          </Typography>
                          <Typography variant="caption" color="warning.main" sx={{ fontSize: 9, fontWeight: 700 }}>
                            ★ {p.rating?.toFixed(1) ?? '—'}
                          </Typography>
                        </Stack>

                        {p.totalRegistrations !== undefined && p.totalRegistrations > 0 && (
                          <Typography variant="caption" color="success.main" display="block" sx={{ fontSize: 8, fontWeight: 600, mt: 0.25 }}>
                            {p.totalRegistrations} reg.
                          </Typography>
                        )}

                        <Chip
                          label={`${matchPercent}% Match`}
                          size="small"
                          sx={{
                            mt: 0.75,
                            height: 14,
                            fontSize: 8,
                            fontWeight: 700,
                            bgcolor: (t) => (isSelected ? t.palette.primary.main : tint(t, 'primary', 0.08)),
                            color: isSelected ? 'primary.contrastText' : 'primary.main',
                            '& .MuiChip-label': { px: 0.5 },
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}

            <Autocomplete
              options={promoterOptions}
              getOptionLabel={(o) => `${o.firstName} ${o.lastName}`}
              value={selectedPromoter}
              onChange={(_, val) => dispatch({ type: 'SET_PROMOTER', value: val })}
              isOptionEqualToValue={(a, b) => a._id === b._id}
              renderOption={({ key, ...props }, option) => (
                <Box
                  key={key}
                  component="li"
                  {...props}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}
                >
                  <Avatar
                    src={option.profileImage}
                    alt={`${option.firstName} ${option.lastName}`}
                    sx={{ width: 32, height: 32 }}
                  />
                  <Box flex={1}>
                    <Typography
                      variant="body2"
                      fontWeight={500}
                    >
                      {option.firstName} {option.lastName}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" mt={0.25}>
                      {option.rating !== undefined && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'flex', alignItems: 'center' }}
                        >
                          {'★'} {option.rating.toFixed(1)}
                        </Typography>
                      )}
                      {option.distanceMiles !== undefined && (
                        <Chip
                          label={`${option.distanceMiles.toFixed(1)} mi`}
                          size="small"
                          sx={{
                            height: 14,
                            fontSize: 8,
                            fontWeight: 700,
                            bgcolor: (t) => tint(t, 'success', 0.08),
                            color: 'success.dark',
                            border: '1px solid',
                            borderColor: (t) => tintBorder(t, 'success', 0.2),
                            '& .MuiChip-label': { px: 0.5 },
                          }}
                        />
                      )}
                    </Stack>
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  placeholder="Buscar promotora..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        {selectedPromoter ? (
                          <Avatar
                            src={selectedPromoter.profileImage}
                            sx={{ width: 22, height: 22, mr: 0.5, flexShrink: 0 }}
                          />
                        ) : (
                          <PersonAddOutlinedIcon
                            fontSize="small"
                            sx={{ color: 'text.disabled', mr: 0.5 }}
                          />
                        )}
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Box>

          {/* Notes */}
          <Box>
            <SectionLabel>
              Notas{' '}
              <Typography
                component="span"
                variant="caption"
                color="text.disabled"
                fontWeight={400}
                sx={{ textTransform: 'none', letterSpacing: 0 }}
              >
                (opcional)
              </Typography>
            </SectionLabel>
            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              placeholder="Instrucciones especiales, notas adicionales..."
              value={notes}
              onChange={(e) => dispatch({ type: 'SET_NOTES', value: e.target.value })}
            />
          </Box>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            flexShrink: 0,
            px: 3,
            py: 2,
            borderTop: (t) => `1px solid ${t.palette.divider}`,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1.5,
            bgcolor: 'background.paper',
          }}
        >
          <Button
            onClick={onClose}
            variant="outlined"
            size="medium"
            sx={{
              borderRadius: 10,
              textTransform: 'none',
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': { borderColor: 'primary.main', bgcolor: (t) => tint(t, 'primary', 0.06) },
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            size="medium"
            onClick={() => saveShift()}
            disabled={!canSave}
            startIcon={saving ? <CircularProgress size={15} color="inherit" /> : undefined}
            sx={{
              borderRadius: 10,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: 'primary.main',
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            {saving ? 'Guardando...' : shiftId ? 'Guardar cambios' : 'Crear turno'}
          </Button>
        </Box>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => dispatch({ type: 'CLOSE_SNACKBAR' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => dispatch({ type: 'CLOSE_SNACKBAR' })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

// ── Small helper ──────────────────────────────────────────────────────────────

function SectionLabel({ children, sx }: { children: React.ReactNode; sx?: object }) {
  return (
    <Typography
      variant="caption"
      color="text.secondary"
      fontWeight={600}
      sx={{
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        mb: 1,
        display: 'block',
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
}

export default NewShiftModal;
