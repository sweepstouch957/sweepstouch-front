import type { MeetingDigest } from '@/services/otter.service';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import ChecklistRoundedIcon from '@mui/icons-material/ChecklistRounded';
import GavelRoundedIcon from '@mui/icons-material/GavelRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { alpha, Avatar, Box, Chip, Divider, Paper, Stack, Typography, useTheme } from '@mui/material';
import React from 'react';
import { tint, type SemanticRole } from 'src/theme/semantic';
import { IMPACT_LABEL, IMPACT_ROLE, initials } from './constants';

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  role?: SemanticRole;
  count?: number;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon, role = 'primary', count, children }) => {
  const theme = useTheme();
  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        mb={1.5}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: 1.5,
            display: 'grid',
            placeItems: 'center',
            bgcolor: tint(theme, role, theme.palette.mode === 'dark' ? 0.2 : 0.12),
            color: `${role}.main`,
            '& svg': { fontSize: 17 },
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="subtitle2"
          fontWeight={800}
        >
          {title}
        </Typography>
        {count !== undefined && (
          <Chip
            size="small"
            label={count}
            sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
          />
        )}
      </Stack>
      {children}
    </Box>
  );
};

const Bullets: React.FC<{ items: string[] }> = ({ items }) => (
  <Stack
    component="ul"
    spacing={0.75}
    sx={{ m: 0, pl: 2.5 }}
  >
    {items.map((item, i) => (
      <Typography
        component="li"
        variant="body2"
        key={`${item}-${i}`}
      >
        {item}
      </Typography>
    ))}
  </Stack>
);

/** Presentacional puro: recibe el digest ya generado y lo pinta. */
export const DigestView: React.FC<{ digest: MeetingDigest; truncated?: boolean }> = ({
  digest,
  truncated,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const has = (arr?: unknown[]) => Array.isArray(arr) && arr.length > 0;

  return (
    <Stack spacing={3}>
      {truncated && (
        <Chip
          size="small"
          color="warning"
          variant="outlined"
          label="Transcript largo: se analizó sólo la primera parte"
        />
      )}

      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: tint(theme, 'primary', isDark ? 0.12 : 0.06),
          border: '1px solid',
          borderColor: alpha(theme.palette.primary.main, 0.25),
        }}
      >
        <Typography variant="body2">{digest.resumen}</Typography>
      </Paper>

      {has(digest.porPersona) && (
        <Section
          title="Por persona"
          icon={<PersonRoundedIcon />}
          count={digest.porPersona.length}
        >
          <Stack
            spacing={1.5}
            divider={<Divider flexItem />}
          >
            {digest.porPersona.map((p) => (
              <Stack
                key={p.persona}
                direction="row"
                spacing={1.5}
                alignItems="flex-start"
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: 12,
                    fontWeight: 700,
                    bgcolor: alpha(theme.palette.primary.main, 0.18),
                    color: 'primary.main',
                  }}
                >
                  {initials(p.persona)}
                </Avatar>
                <Box flex={1}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                  >
                    {p.persona}
                  </Typography>
                  {p.hizo && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      <b>Hizo:</b> {p.hizo}
                    </Typography>
                  )}
                  {p.hara && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      <b>Hará:</b> {p.hara}
                    </Typography>
                  )}
                  {p.bloqueos && (
                    <Typography
                      variant="body2"
                      sx={{ color: 'error.main' }}
                    >
                      <b>Bloqueo:</b> {p.bloqueos}
                    </Typography>
                  )}
                </Box>
              </Stack>
            ))}
          </Stack>
        </Section>
      )}

      {has(digest.decisiones) && (
        <Section
          title="Decisiones"
          icon={<GavelRoundedIcon />}
          role="success"
          count={digest.decisiones.length}
        >
          <Bullets items={digest.decisiones} />
        </Section>
      )}

      {has(digest.bloqueos) && (
        <Section
          title="Bloqueos"
          icon={<BlockRoundedIcon />}
          role="error"
          count={digest.bloqueos.length}
        >
          <Stack spacing={1}>
            {digest.bloqueos.map((b, i) => {
              const role = IMPACT_ROLE[b.impacto || 'medio'] || 'warning';
              return (
              <Stack
                key={`${b.que}-${i}`}
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
              >
                <Chip
                  size="small"
                  label={IMPACT_LABEL[b.impacto || 'medio'] || 'Medio'}
                  sx={{
                    height: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    color: theme.palette[role].main,
                    bgcolor: tint(theme, role, 0.15),
                  }}
                />
                <Typography
                  variant="body2"
                  flex={1}
                >
                  {b.que}
                </Typography>
                {b.quien && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {b.quien}
                  </Typography>
                )}
              </Stack>
              );
            })}
          </Stack>
        </Section>
      )}

      {has(digest.actionItems) && (
        <Section
          title="Action items"
          icon={<ChecklistRoundedIcon />}
          role="info"
          count={digest.actionItems.length}
        >
          <Stack spacing={1}>
            {digest.actionItems.map((a, i) => (
              <Paper
                key={`${a.tarea}-${i}`}
                elevation={0}
                sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}
              >
                <Typography variant="body2">{a.tarea}</Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  mt={0.5}
                >
                  {a.responsable && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={a.responsable}
                      sx={{ height: 20, fontSize: 11 }}
                    />
                  )}
                  {a.fecha && (
                    <Chip
                      size="small"
                      variant="outlined"
                      color="info"
                      label={a.fecha}
                      sx={{ height: 20, fontSize: 11 }}
                    />
                  )}
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Section>
      )}

      {has(digest.riesgos) && (
        <Section
          title="Riesgos"
          icon={<WarningAmberRoundedIcon />}
          role="warning"
          count={digest.riesgos.length}
        >
          <Bullets items={digest.riesgos} />
        </Section>
      )}

      {has(digest.temas) && (
        <Stack
          direction="row"
          spacing={0.75}
          flexWrap="wrap"
          useFlexGap
        >
          {digest.temas.map((t) => (
            <Chip
              key={t}
              size="small"
              label={t}
              variant="outlined"
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
};
