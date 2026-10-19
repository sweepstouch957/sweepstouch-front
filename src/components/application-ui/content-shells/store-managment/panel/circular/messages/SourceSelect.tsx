'use client';

import { Chip, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { productCount } from '../hooks';
import { fmtShortDate, SOURCE_STATUS, type MessageSource } from './constants';

/** Selector "Productos de": cada opción dice si es flyer o circular, fechas y cuántos productos. */
export default function SourceSelect({
  sources,
  value,
  onChange,
}: {
  sources: MessageSource[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <TextField
      select
      size="small"
      label="Productos de"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{ flex: 1, minWidth: 0, width: '100%' }}
    >
      {sources.map(({ c, kind }) => {
        const st = SOURCE_STATUS[c.status];
        return (
          <MenuItem
            key={c._id}
            value={c._id}
          >
            <Stack
              direction="row"
              alignItems="center"
              gap={1}
              sx={{ minWidth: 0, width: '100%' }}
            >
              <Chip
                size="small"
                label={kind}
                variant="outlined"
                sx={{ height: 20, fontSize: 11 }}
              />
              <Typography
                noWrap
                sx={{ fontSize: 14, fontWeight: 600, flex: 1, minWidth: 0 }}
              >
                {c.title || 'Sin título'}
              </Typography>
              <Typography
                sx={{
                  fontSize: 12,
                  color: 'text.secondary',
                  whiteSpace: 'nowrap',
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                {fmtShortDate(c.startDate)} → {fmtShortDate(c.endDate)} · {productCount(c)} prod.
              </Typography>
              {st && (
                <Chip
                  size="small"
                  color={st.color}
                  label={st.label}
                  sx={{ height: 20, fontSize: 11 }}
                />
              )}
            </Stack>
          </MenuItem>
        );
      })}
    </TextField>
  );
}
