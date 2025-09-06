'use client';

import { useMemo, useRef, useState } from 'react';
import { Box, IconButton, InputAdornment, Popover, TextField, useTheme } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ClearIcon from '@mui/icons-material/Clear';
import { DateRange, Range, RangeKeyDict } from 'react-date-range';
import { format, startOfDay, endOfDay } from 'date-fns';

export type DateRangeValue = { startDate: Date | null; endDate: Date | null };

function fmt(value: DateRangeValue) {
  const { startDate, endDate } = value;
  if (!startDate && !endDate) return '';
  if (startDate && !endDate) return `${format(startDate, 'MM/dd/yyyy')} –`;
  if (!startDate && endDate) return `– ${format(endDate, 'MM/dd/yyyy')}`;
  return `${format(startDate!, 'MM/dd/yyyy')} – ${format(endDate!, 'MM/dd/yyyy')}`;
}

export default function RangePicker({
  value,
  onChange,
  minDate,
  maxDate,
  label = 'Rango de fechas',
}: {
  value: DateRangeValue;
  onChange: (val: DateRangeValue) => void;
  minDate?: Date;
  maxDate?: Date;
  label?: string;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLInputElement>(null);

  const range: Range = useMemo(
    () => ({
      key: 'selection',
      startDate: value.startDate ?? undefined,
      endDate: value.endDate ?? value.startDate ?? undefined,
    }),
    [value]
  );

  const handleChange = (r: RangeKeyDict) => {
    const sel = r.selection;
    onChange({
      startDate: sel.startDate ? startOfDay(sel.startDate) : null,
      endDate: sel.endDate ? endOfDay(sel.endDate) : null,
    });
  };

  return (
    <>
      <TextField
        inputRef={anchorRef}
        label={label}
        size="small"
        value={fmt(value)}
        onClick={() => setOpen(true)}
        InputProps={{
          readOnly: true,
          sx: {
            minWidth: 280,
            background: theme.palette.mode === 'dark' ? '#1f1f1f' : '#fff',
            borderRadius: 2,
            cursor: 'pointer',
          },
          startAdornment: (
            <InputAdornment position="start">
              <CalendarMonthIcon fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: (value.startDate || value.endDate) && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange({ startDate: null, endDate: null });
                }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Popover
        open={open}
        onClose={() => setOpen(false)}
        anchorEl={anchorRef.current}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { p: 1 } } }}
      >
        <Box>
          <DateRange
            ranges={[range]}
            onChange={handleChange}
            moveRangeOnFirstSelection={false}
            editableDateInputs
            rangeColors={[theme.palette.primary.main]}
            months={2}
            direction="horizontal"
            minDate={minDate}
            maxDate={maxDate}
          />
        </Box>
      </Popover>
    </>
  );
}
