import type {
  DigestAudience,
  DigestResponse,
  OtterActionItem,
  OtterConversation,
  OtterTranscript,
} from '@/services/otter.service';
import { speakerName } from '@/services/otter.service';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import {
  alpha,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Drawer,
  IconButton,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useState } from 'react';
import { headerOffset } from 'src/theme/utils';
import {
  formatDuration,
  formatWhen,
  initials,
  meetingDate,
  meetingDuration,
  meetingSpeakers,
  meetingTitle,
} from './constants';
import { DigestView } from './digest-view';

interface Props {
  open: boolean;
  onClose: () => void;
  meeting: OtterConversation | null;
  transcript?: OtterTranscript;
  transcriptLoading: boolean;
  transcriptError?: string;
  actionItems: OtterActionItem[];
  actionItemsLoading: boolean;
  digest?: DigestResponse;
  digestLoading: boolean;
  digestError?: string;
  audience: DigestAudience;
  onAudienceChange: (a: DigestAudience) => void;
  onGenerateDigest: () => void;
  onCopyDigest: () => void;
}

const EmptyTab: React.FC<{ text: string }> = ({ text }) => (
  <Typography
    variant="body2"
    color="text.secondary"
    sx={{ py: 4, textAlign: 'center' }}
  >
    {text}
  </Typography>
);

/**
 * Detalle de una reunión. Presentacional: todas las queries viven en el shell.
 */
export const MeetingDetailDrawer: React.FC<Props> = ({
  open,
  onClose,
  meeting,
  transcript,
  transcriptLoading,
  transcriptError,
  actionItems,
  actionItemsLoading,
  digest,
  digestLoading,
  digestError,
  audience,
  onAudienceChange,
  onGenerateDigest,
  onCopyDigest,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [tab, setTab] = useState(0);

  if (!meeting) return null;

  const speakers = meetingSpeakers(meeting);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', md: 620 },
          top: { md: headerOffset },
          height: { md: `calc(100% - ${headerOffset})` },
          bgcolor: 'background.default',
        },
      }}
    >
      {/* ── Cabecera ── */}
      <Box
        sx={{
          p: 2.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Stack
          direction="row"
          alignItems="flex-start"
          spacing={1}
        >
          <Box flex={1}>
            <Typography
              variant="h6"
              fontWeight={800}
            >
              {meetingTitle(meeting)}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              mt={1}
              flexWrap="wrap"
              useFlexGap
            >
              <Chip
                size="small"
                variant="outlined"
                label={formatWhen(meetingDate(meeting))}
              />
              <Chip
                size="small"
                variant="outlined"
                label={formatDuration(meetingDuration(meeting))}
              />
              {meeting.share_url && (
                <Chip
                  size="small"
                  clickable
                  component="a"
                  href={meeting.share_url}
                  target="_blank"
                  rel="noopener"
                  color="primary"
                  variant="outlined"
                  icon={<OpenInNewRoundedIcon />}
                  label="Ver en Otter"
                />
              )}
            </Stack>
          </Box>
          <IconButton onClick={onClose}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        {speakers.length > 0 && (
          <Stack
            direction="row"
            spacing={0.75}
            mt={2}
            flexWrap="wrap"
            useFlexGap
          >
            {speakers.map((name) => (
              <Chip
                key={name}
                size="small"
                avatar={
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.2),
                      color: 'primary.main',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {initials(name)}
                  </Avatar>
                }
                label={name}
              />
            ))}
          </Stack>
        )}

        <Tabs
          value={tab}
          onChange={(_e, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mt: 2, minHeight: 40, '& .MuiTab-root': { minHeight: 40, textTransform: 'none' } }}
        >
          <Tab label="Resumen IA" />
          <Tab label="Transcript" />
          <Tab label={`Action items${actionItems.length ? ` (${actionItems.length})` : ''}`} />
        </Tabs>
      </Box>

      {/* ── Contenido ── */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
        {tab === 0 && (
          <Stack spacing={2.5}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              alignItems={{ sm: 'center' }}
              justifyContent="space-between"
            >
              <ToggleButtonGroup
                size="small"
                exclusive
                value={audience}
                onChange={(_e, v) => v && onAudienceChange(v as DigestAudience)}
              >
                <ToggleButton value="po">Para PO</ToggleButton>
                <ToggleButton value="general">General</ToggleButton>
              </ToggleButtonGroup>

              <Stack
                direction="row"
                spacing={1}
              >
                {digest && (
                  <Tooltip title="Copiar resumen">
                    <IconButton
                      size="small"
                      onClick={onCopyDigest}
                    >
                      <ContentCopyRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Button
                  size="small"
                  variant="contained"
                  disabled={digestLoading}
                  startIcon={
                    digestLoading ? (
                      <CircularProgress
                        size={14}
                        color="inherit"
                      />
                    ) : (
                      <AutoAwesomeRoundedIcon />
                    )
                  }
                  onClick={onGenerateDigest}
                >
                  {digest ? 'Regenerar' : 'Generar resumen'}
                </Button>
              </Stack>
            </Stack>

            {digestLoading && (
              <Stack spacing={1.5}>
                <Skeleton
                  variant="rounded"
                  height={72}
                />
                <Skeleton
                  variant="rounded"
                  height={140}
                />
                <Skeleton
                  variant="rounded"
                  height={100}
                />
              </Stack>
            )}

            {!digestLoading && digestError && (
              <Typography
                variant="body2"
                color="error.main"
              >
                {digestError}
              </Typography>
            )}

            {!digestLoading && !digestError && digest && (
              <DigestView
                digest={digest.digest}
                truncated={digest.truncated}
              />
            )}

            {!digestLoading && !digestError && !digest && (
              <EmptyTab text="Generá el resumen para ver qué dijo cada uno, decisiones, bloqueos y action items." />
            )}
          </Stack>
        )}

        {tab === 1 && (
          <>
            {transcriptLoading && (
              <Stack spacing={1}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    variant="text"
                    height={22}
                  />
                ))}
              </Stack>
            )}
            {!transcriptLoading && transcriptError && (
              <Typography
                variant="body2"
                color="error.main"
              >
                {transcriptError}
              </Typography>
            )}
            {!transcriptLoading && !transcriptError && (
              transcript?.text ? (
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    lineHeight: 1.7,
                    color: 'text.secondary',
                    bgcolor: alpha(theme.palette.text.primary, isDark ? 0.04 : 0.02),
                    p: 2,
                    borderRadius: 2,
                  }}
                >
                  {transcript.text}
                </Typography>
              ) : (
                <EmptyTab text="Esta reunión todavía no tiene transcript en Otter." />
              )
            )}
          </>
        )}

        {tab === 2 && (
          <>
            {actionItemsLoading && (
              <Stack spacing={1}>
                <Skeleton
                  variant="rounded"
                  height={48}
                />
                <Skeleton
                  variant="rounded"
                  height={48}
                />
              </Stack>
            )}
            {!actionItemsLoading && actionItems.length === 0 && (
              <EmptyTab text="Otter no marcó action items en esta reunión." />
            )}
            {!actionItemsLoading && actionItems.length > 0 && (
              <Stack spacing={1}>
                {actionItems.map((item, i) => (
                  <Box
                    key={item.id || i}
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Typography variant="body2">{item.text || item.title}</Typography>
                    {(item.assignee || item.due_date) && (
                      <Stack
                        direction="row"
                        spacing={1}
                        mt={0.75}
                      >
                        {item.assignee && (
                          <Chip
                            size="small"
                            variant="outlined"
                            label={speakerName(item.assignee)}
                            sx={{ height: 20, fontSize: 11 }}
                          />
                        )}
                        {item.due_date && (
                          <Chip
                            size="small"
                            variant="outlined"
                            color="info"
                            label={item.due_date}
                            sx={{ height: 20, fontSize: 11 }}
                          />
                        )}
                      </Stack>
                    )}
                  </Box>
                ))}
              </Stack>
            )}
          </>
        )}
      </Box>
    </Drawer>
  );
};
