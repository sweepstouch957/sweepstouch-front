import type { OtterConversation } from '@/services/otter.service';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import {
  alpha,
  Avatar,
  AvatarGroup,
  Box,
  Chip,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';
import {
  formatDuration,
  formatWhen,
  initials,
  meetingDate,
  meetingDuration,
  meetingSpeakers,
  meetingTitle,
} from './constants';

interface Props {
  meeting: OtterConversation;
  selected: boolean;
  onOpen: (id: string) => void;
}

/** Tarjeta de la grilla. Memo: la lista puede traer cientos de reuniones. */
export const MeetingCard: React.FC<Props> = React.memo(({ meeting, selected, onOpen }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const speakers = meetingSpeakers(meeting);
  const summary = meeting.summary?.trim();

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={() => onOpen(meeting.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(meeting.id);
        }
      }}
      sx={{
        cursor: 'pointer',
        p: 2.5,
        height: '100%',
        borderRadius: 2,
        border: '1px solid',
        borderColor: selected
          ? theme.palette.primary.main
          : alpha(theme.palette.divider, isDark ? 0.6 : 1),
        bgcolor: selected
          ? alpha(theme.palette.primary.main, isDark ? 0.14 : 0.06)
          : 'background.paper',
        transition: theme.transitions.create(['border-color', 'box-shadow', 'transform'], {
          duration: 150,
        }),
        '&:hover': {
          borderColor: theme.palette.primary.main,
          boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, isDark ? 0.25 : 0.12)}`,
          transform: 'translateY(-2px)',
        },
        '&:focus-visible': {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2,
        },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:hover': { transform: 'none' } },
      }}
    >
      <Stack
        spacing={1.5}
        height="100%"
      >
        <Typography
          variant="subtitle1"
          fontWeight={700}
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {meetingTitle(meeting)}
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
        >
          <Chip
            size="small"
            variant="outlined"
            icon={<ScheduleRoundedIcon />}
            label={formatWhen(meetingDate(meeting))}
          />
          <Chip
            size="small"
            variant="outlined"
            label={formatDuration(meetingDuration(meeting))}
          />
        </Stack>

        {summary ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {summary}
          </Typography>
        ) : (
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            color="text.disabled"
          >
            <AutoAwesomeRoundedIcon fontSize="inherit" />
            <Typography variant="caption">Sin resumen — generalo con IA</Typography>
          </Stack>
        )}

        <Box flexGrow={1} />

        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
        >
          <GroupsRoundedIcon
            fontSize="small"
            sx={{ color: 'text.disabled' }}
          />
          {speakers.length ? (
            <AvatarGroup
              max={5}
              sx={{
                '& .MuiAvatar-root': {
                  width: 26,
                  height: 26,
                  fontSize: 11,
                  fontWeight: 700,
                  bgcolor: alpha(theme.palette.primary.main, 0.18),
                  color: 'primary.main',
                  borderColor: 'background.paper',
                },
              }}
            >
              {speakers.map((name) => (
                <Tooltip
                  key={name}
                  title={name}
                >
                  <Avatar>{initials(name)}</Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>
          ) : (
            <Typography
              variant="caption"
              color="text.disabled"
            >
              Sin participantes
            </Typography>
          )}
        </Stack>
      </Stack>
    </Box>
  );
});

MeetingCard.displayName = 'MeetingCard';
