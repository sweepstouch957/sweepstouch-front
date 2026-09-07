'use client';

/** Paso 3 · Audiencia — prueba (autocomplete de la base / primeros N) o campaña
 *  programada (título + fecha, sólo en ese modo). */

import {
  Autocomplete,
  Box,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import type { RcsBuilderApi } from './use-rcs-builder';

export default function StepAudience({ b }: { b: RcsBuilderApi }) {
  return (
    <>
      <Typography
        variant="body2"
        color="text.secondary"
        mb={1.5}
      >
        Las pruebas salen al momento. «Toda la base» crea una campaña programada.
      </Typography>
      <RadioGroup
        value={b.audMode}
        onChange={(e) => b.setAudMode(e.target.value as any)}
      >
        <FormControlLabel
          value="numbers"
          control={<Radio size="small" />}
          label="Números específicos — prueba, se envía ahora"
        />
        {b.audMode === 'numbers' && (
          <Box
            ml={4}
            mb={1}
          >
            <Autocomplete
              multiple
              freeSolo
              size="small"
              options={b.custOptions}
              value={b.audSelected}
              inputValue={b.audInput}
              onInputChange={(_, v) => b.setAudInput(v)}
              onChange={(_, v) => b.setAudSelected(v)}
              loading={b.searchingCustomers}
              filterOptions={(x) => x}
              getOptionLabel={(o: any) =>
                typeof o === 'string'
                  ? o
                  : `${[o.firstName, o.lastName].filter(Boolean).join(' ') || 'Cliente'} · ${o.phoneNumber}`
              }
              isOptionEqualToValue={(o: any, v: any) =>
                String(o?.phoneNumber || o) === String(v?.phoneNumber || v)
              }
              renderOption={(props, o: any) => (
                <li
                  {...props}
                  key={o._id || o.phoneNumber}
                >
                  <Stack minWidth={0}>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      noWrap
                    >
                      {[o.firstName, o.lastName].filter(Boolean).join(' ') || 'Sin nombre'}
                      {o.active === false ? ' · INACTIVO' : ''}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {o.phoneNumber}
                    </Typography>
                  </Stack>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar en la base"
                  placeholder="Nombre o teléfono…"
                  helperText={`${b.parsedNumbers.length} seleccionado(s) — también podés pegar un número y Enter.`}
                />
              )}
            />
          </Box>
        )}
        <FormControlLabel
          value="limit"
          control={<Radio size="small" />}
          label="Primeros N de la base — prueba, se envía ahora"
        />
        {b.audMode === 'limit' && (
          <TextField
            size="small"
            type="number"
            label="Cantidad de clientes"
            value={b.audLimit}
            onChange={(e) => b.setAudLimit(Math.max(1, Number(e.target.value) || 1))}
            inputProps={{ min: 1, max: b.totalAudience || undefined }}
            sx={{ maxWidth: 220, ml: 4, mb: 1 }}
          />
        )}
        <FormControlLabel
          value="all"
          control={<Radio size="small" />}
          label={`Toda la base (${b.totalAudience.toLocaleString()}) — campaña programada`}
        />
      </RadioGroup>

      {b.audMode === 'all' && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          mt={1.5}
          ml={4}
        >
          <TextField
            size="small"
            label="Título de la campaña"
            value={b.title}
            onChange={(e) => b.setTitle(e.target.value)}
            error={b.attempted[2] && !b.title.trim()}
            helperText={
              b.attempted[2] && !b.title.trim() ? 'Obligatorio para identificarla en el panel.' : undefined
            }
            sx={{ flex: 1, minWidth: 220 }}
          />
          <DateTimePicker
            label="Fecha y hora de envío"
            value={b.startDate}
            onChange={(d) => d && b.setStartDate(d)}
            slotProps={{ textField: { size: 'small' } }}
            sx={{ minWidth: 220 }}
          />
        </Stack>
      )}
    </>
  );
}
