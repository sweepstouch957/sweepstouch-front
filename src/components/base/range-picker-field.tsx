import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  InputAdornment,
  Stack,
  TextField,
} from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers';
import { PickersDay, type PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

function pad2(v: number) {
  return String(v).padStart(2, '0');
}

function ymdToLocalDate(ymd: string): Date | null {
  const m = String(ymd || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function localDateToYmd(date: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export type RangePickerValue = {
  startYmd: string;
  endYmd: string;
};

export default function RangePickerField({
  label,
  value,
  onChange,
  size = 'small',
  fullWidth = true,
  sx,
}: {
  label: string;
  value: RangePickerValue;
  onChange: (next: RangePickerValue) => void;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  sx?: any;
}) {
  const { t } = useTranslation();
  const { startYmd, endYmd } = value;
  const [open, setOpen] = useState(false);

  // Mapear strings (ej: 2024-01-01) a Date locales (sin problemas de UTC/Timezone)
  // ya que si nos dan la fecha exacta queremos que el picker la refleje correctamente.
  // Sin embargo si vienen strings con horas (ISO full) podemos simplemente cortar 'T'.
  const startYmdClean = typeof startYmd === 'string' ? startYmd.split('T')[0] : '';
  const endYmdClean = typeof endYmd === 'string' ? endYmd.split('T')[0] : '';

  const startDate = ymdToLocalDate(startYmdClean);
  const endDate = ymdToLocalDate(endYmdClean);

  const [draftStart, setDraftStart] = useState<Date | null>(startDate);
  const [draftEnd, setDraftEnd] = useState<Date | null>(endDate);
  const [anchorMonth, setAnchorMonth] = useState<Date>(() => startDate ?? new Date());

  const openDialog = () => {
    setDraftStart(startDate);
    setDraftEnd(endDate);
    setAnchorMonth(startDate ?? new Date());
    setOpen(true);
  };

  const closeDialog = () => setOpen(false);

  const apply = () => {
    const s = localDateToYmd(draftStart);
    const e = localDateToYmd(draftEnd ?? draftStart);
    if (!s) return;
    if (!e) return;
    const nextStart = s <= e ? s : e;
    const nextEnd = s <= e ? e : s;
    // Agregamos tiempo completo de base ISO para integrarse bien con filtros traseros.
    // Usualmente el backend filtra StartDate <= .. etc.. 
    // Para no romper la compatibilidad, devolvemos el YMD si eso se espera.
    onChange({ startYmd: nextStart, endYmd: nextEnd });
    setOpen(false);
  };

  const display = startYmdClean && endYmdClean ? `${startYmdClean} — ${endYmdClean}` : '';

  const CustomDay = (props: PickersDayProps<Date>) => {
    const { day, outsideCurrentMonth, ...other } = props;
    const s = draftStart;
    const e = draftEnd ?? draftStart;
    
    // Normalizamos tiempos para no lidiar con microsegundos
    const time = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
    const startTime = s ? new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime() : null;
    const endTime = e ? new Date(e.getFullYear(), e.getMonth(), e.getDate()).getTime() : null;

    const inRange =
      startTime != null &&
      endTime != null &&
      time >= Math.min(startTime, endTime) &&
      time <= Math.max(startTime, endTime);

    const isStart = startTime != null && time === startTime;
    const isEnd = endTime != null && time === endTime;

    return (
      <PickersDay
        {...(other as any)}
        day={day}
        outsideCurrentMonth={outsideCurrentMonth}
        sx={{
          ...(inRange && {
            bgcolor: 'action.selected',
            borderRadius: 0,
            '&:hover': { bgcolor: 'action.selected' },
          }),
          ...(isStart && {
            borderTopLeftRadius: 16,
            borderBottomLeftRadius: 16,
          }),
          ...(isEnd && {
            borderTopRightRadius: 16,
            borderBottomRightRadius: 16,
          }),
        }}
      />
    );
  };

  const onPick = (date: Date | null) => {
    if (!date || Number.isNaN(date.getTime())) return;
    if (!draftStart || (draftStart && draftEnd)) {
      setDraftStart(date);
      setDraftEnd(null);
      return;
    }
    setDraftEnd(date);
  };

  return (
    <>
      <TextField
        label={label}
        value={display}
        size={size}
        fullWidth={fullWidth}
        sx={sx}
        onClick={openDialog}
        placeholder={t('Select Date Range')}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end">
              <CalendarMonthIcon fontSize="small" sx={{ cursor: 'pointer' }} />
            </InputAdornment>
          ),
        }}
      />

      <Dialog open={open} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} justifyContent="space-between">
              <TextField
                size="small"
                label={t('From')}
                value={localDateToYmd(draftStart)}
                InputProps={{ readOnly: true }}
                fullWidth
              />
              <TextField
                size="small"
                label={t('To')}
                value={localDateToYmd(draftEnd ?? draftStart)}
                InputProps={{ readOnly: true }}
                fullWidth
              />
            </Stack>

            <DateCalendar
              value={anchorMonth}
              onChange={(v) => {
                if (v && !Number.isNaN(v.getTime())) {
                  setAnchorMonth(v);
                  onPick(v);
                }
              }}
              slots={{ day: CustomDay as any }}
              referenceDate={anchorMonth}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeDialog} color="inherit">{t('Cancel')}</Button>
          <Button variant="contained" onClick={apply} disabled={!draftStart}>
            {t('Apply')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
