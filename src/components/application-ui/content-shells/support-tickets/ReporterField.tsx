'use client';

import { alpha, Avatar, Box, Chip, Stack, TextField, Typography } from '@mui/material';
import { type Theme } from '@mui/material/styles';
import {
  useWatch,
  type Control,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form';
import { rhf } from './ticket-form';
import { FormState } from './types';

/** Reportante: los dos chips y el nombre dependen entre sí, van juntos. */
export function ReporterField({
  control,
  register,
  setValue,
  currentUserName,
  theme,
}: {
  control: Control<FormState>;
  register: UseFormRegister<FormState>;
  setValue: UseFormSetValue<FormState>;
  currentUserName: string;
  theme: Theme;
}) {
  const isCurrentUser = useWatch({ control, name: 'reporterIsCurrentUser' });

  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight={600}
        sx={{ display: 'block', mb: 0.75, fontSize: 11 }}
      >
        Reportado por
      </Typography>
      <Stack
        direction="row"
        spacing={0.75}
        mb={1}
      >
        <Chip
          label="Yo (usuario actual)"
          size="small"
          onClick={() => {
            setValue('reporterIsCurrentUser', true);
            setValue('reporterName', currentUserName);
          }}
          sx={{
            cursor: 'pointer',
            fontWeight: isCurrentUser ? 700 : 500,
            bgcolor: isCurrentUser ? 'primary.main' : 'transparent',
            color: isCurrentUser ? 'common.white' : 'text.secondary',
            border: '1px solid',
            borderColor: isCurrentUser ? 'primary.main' : 'divider',
          }}
        />
        <Chip
          label="Tercero"
          size="small"
          onClick={() => {
            setValue('reporterIsCurrentUser', false);
            setValue('reporterName', '');
          }}
          sx={{
            cursor: 'pointer',
            fontWeight: !isCurrentUser ? 700 : 500,
            bgcolor: !isCurrentUser ? 'primary.main' : 'transparent',
            color: !isCurrentUser ? 'common.white' : 'text.secondary',
            border: '1px solid',
            borderColor: !isCurrentUser ? 'primary.main' : 'divider',
          }}
        />
      </Stack>
      {isCurrentUser ? (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{
            px: 1.25,
            py: 0.85,
            borderRadius: 1.5,
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
          }}
        >
          <Avatar
            sx={{
              width: 26,
              height: 26,
              fontSize: 11,
              fontWeight: 700,
              bgcolor: 'primary.main',
              flexShrink: 0,
            }}
          >
            {currentUserName?.[0]?.toUpperCase() ?? 'U'}
          </Avatar>
          <Typography
            variant="body2"
            fontWeight={600}
            flex={1}
            noWrap
          >
            {currentUserName || 'Usuario actual'}
          </Typography>
          <Chip
            label="Tú"
            size="small"
            color="primary"
            variant="outlined"
            sx={{ height: 16, fontSize: 9, fontWeight: 700, '& .MuiChip-label': { px: 0.5 } }}
          />
        </Stack>
      ) : (
        <TextField
          label="Nombre del reportante"
          {...rhf(register, 'reporterName')}
          fullWidth
          size="small"
          placeholder="Nombre completo del tercero..."
          autoFocus
        />
      )}
    </Box>
  );
}
