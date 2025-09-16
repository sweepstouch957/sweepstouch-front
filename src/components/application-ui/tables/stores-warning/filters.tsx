'use client';

import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import RefreshIcon from '@mui/icons-material/Refresh';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  alpha,
  Box,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';

export type SortKey = 'nearest' | 'promoters' | 'name' | 'customers';

type Props = {
  radiusKm?: number; // backend usa millas, pero mantenemos el prop por compat
  total?: number;
  isLoading?: boolean;
  onRetry?: () => void;
  changeRadius?: (n: number) => void;

  searchTerm: string;
  onSearchTermChange: (s: string) => void;

  audienceMax: string;
  onAudienceMaxChange: (s: string) => void;

  sortBy: SortKey;
  setSortBy: (s: SortKey) => void;
};

const FiltersBar: React.FC<Props> = ({
  radiusKm,
  total,
  isLoading,
  onRetry,
  changeRadius,
  searchTerm,
  onSearchTermChange,
  audienceMax,
  onAudienceMaxChange,
  sortBy,
  setSortBy,
}) => {
  const theme = useTheme();

  // radius slider (solo slider, sin chips de presets)
  const [radiusLocal, setRadiusLocal] = useState<number>(
    typeof radiusKm === 'number' ? radiusKm : 20
  );
  useEffect(() => {
    if (typeof radiusKm === 'number') setRadiusLocal(radiusKm);
  }, [radiusKm]);

  // audiencia slider + input compacto
  const [audLocal, setAudLocal] = useState<number>(Number(audienceMax) || 1500);
  useEffect(() => {
    const v = Number(audienceMax);
    if (!isNaN(v)) setAudLocal(v);
  }, [audienceMax]);

  const resetAll = () => {
    onSearchTermChange('');
    onAudienceMaxChange('1500');
    changeRadius?.(20);
  };

  // estilo pill para inputs
  const pillSx = {
    '& .MuiOutlinedInput-root': {
      height: 36,
      maxHeight: 36,
      borderRadius: 999,
      backgroundColor: 'common.white',
      px: 0.5,
      '& fieldset': { borderColor: 'divider' },
      '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.35) },
      '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: 1.5 },
    },
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        my: 2,
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        background: (t) =>
          `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.06)} 0%, ${alpha(
            t.palette.secondary.main,
            0.06
          )} 100%)`,
      }}
    >
      {/* Resumen compacto */}
      <Stack
        direction="row"
        spacing={"8px"}
        flexWrap="wrap"
        mb={1.5}
      >
        <Chip
          icon={<GpsFixedIcon sx={{ color: 'primary.main' }} />}
          label={
            <Typography
              variant="body2"
              fontWeight={700}
            >
              Radio: {radiusKm ?? 20} mi
            </Typography>
          }
          sx={{
            bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        />
        <Chip
          icon={<VisibilityIcon sx={{ color: 'text.secondary' }} />}
          label={
            <Typography
              variant="body2"
              fontWeight={700}
            >
              Tiendas: {total ?? 0}
            </Typography>
          }
          sx={{
            bgcolor: (t) => alpha(t.palette.text.secondary, 0.06),
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        />
      </Stack>

      <Grid
        container
        spacing={"8px"}
        alignItems="center"
      >
        {/* Radio (slider) */}
        <Grid
          item
          xs={12}
          md={6}
        >
          <Box
            sx={{
              p: 1.25,
              borderRadius: 3,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              mb={0.5}
            >
              <Typography
                variant="body2"
                fontWeight={700}
                color="text.secondary"
              >
                Radio (mi)
              </Typography>
              <Typography
                variant="body2"
                fontWeight={700}
              >
                {radiusLocal}
              </Typography>
            </Stack>
            <Slider
              value={radiusLocal}
              min={5}
              max={100}
              step={5}
              onChange={(_, v) => setRadiusLocal(Number(v))}
              onChangeCommitted={(_, v) => changeRadius?.(Number(v))}

            />
          </Box>
        </Grid>

        {/* Audiencia (slider + input peque) */}
        <Grid
          item
          xs={12}
          md={6}
        >
          <Box
            sx={{
              pt: 1,
              px: 1.25,

              borderRadius: 3,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Stack
              direction="row"
              spacing={0}
              alignItems="center"
              mb={0.5}
            >
              <Typography
                variant="body2"
                fontWeight={700}
                mb={0}
                color="text.secondary"
              >
                Audiencia
              </Typography>
              <Box flex={1} />
              <TextField
                size="small"
                type="text"
                inputMode="numeric"
                value={audienceMax}
                onChange={(e) => {
                  const v = e.target.value;
                  if (!/^\d*$/.test(v)) return;
                  onAudienceMaxChange(v);
                }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">clientes</InputAdornment>,
                }}
                sx={{ width: 160, ...pillSx ,


                }}
              />
            </Stack>
            <Slider
              value={audLocal}
              min={100}
              max={5000}
              step={50}
              sx={{
                mt:0,
                mb:0,
              }}
              onChange={(_, v) => setAudLocal(Number(v))}
              onChangeCommitted={(_, v) => onAudienceMaxChange(String(v))}
            />
          </Box>
        </Grid>

        {/* Search */}
        <Grid
          item
          xs={12}
          md={8}
        >
          <TextField
            placeholder="Buscar tienda, dirección o ZIP"
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon color="disabled" />
                </InputAdornment>
              ),
            }}
            sx={pillSx}
          />
        </Grid>

        {/* Orden + acciones */}
        <Grid
          item
          xs={12}
          md={4}
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 999,
                px: 1.25,
                py: 0.5,
                bgcolor: 'background.paper',
                minHeight: 36,
              }}
            >
              <TuneIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography
                variant="body2"
                sx={{ mr: 1.25, color: 'text.secondary' }}
              >
                Ordenar
              </Typography>
              <Select
                variant="standard"
                disableUnderline
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                sx={{ fontWeight: 700, minWidth: 150 }}
              >
                <MenuItem value="nearest">Más cerca</MenuItem>
                <MenuItem value="promoters">Más promotoras</MenuItem>
                <MenuItem value="customers">Más clientes</MenuItem>
                <MenuItem value="name">Nombre de tienda</MenuItem>
              </Select>
            </Box>

            <Tooltip title="Refrescar">
              <span>
                <IconButton
                  onClick={() => onRetry?.()}
                  disabled={isLoading}
                >
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Reiniciar filtros">
              <span>
                <IconButton
                  onClick={resetAll}
                  disabled={isLoading}
                >
                  <RestartAltIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default FiltersBar;
