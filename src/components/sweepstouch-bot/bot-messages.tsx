'use client';

import { MarkdownContent } from '@/components/application-ui/content-shells/ai-assistant/MarkdownContent';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import { Box, Button, ButtonBase, Stack, useTheme } from '@mui/material';
import { memo, useEffect, useRef, useState } from 'react';
import { tint } from 'src/theme/semantic';
import { BrandAvatar, NO_MOTION, useBrand } from './brand';
import type { Turn } from './constants';

/* ── Un turno. Memoizado: mientras llega una respuesta sólo se repinta la última burbuja. ── */

const MyBubble = memo(function MyBubble({ text }: { text: string }) {
  const brand = useBrand();
  return (
    <Box
      sx={{
        alignSelf: 'flex-end',
        maxWidth: '84%',
        px: 1.75,
        py: 1.1,
        borderRadius: '18px 18px 6px 18px',
        background: brand.gradient,
        color: brand.onBrand,
        fontSize: 13.5,
        fontWeight: 500,
        lineHeight: 1.5,
        overflowWrap: 'anywhere',
        whiteSpace: 'pre-wrap',
      }}
    >
      {text}
    </Box>
  );
});

type BotBubbleProps = { turn: Turn; streaming: boolean; onNavigate: (route: string) => void };

const BotBubble = memo(function BotBubble({ turn, streaming, onNavigate }: BotBubbleProps) {
  const theme = useTheme();
  const brand = useBrand();
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard?.writeText(turn.text).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  };

  return (
    <Stack
      direction="row"
      alignItems="flex-start"
      gap={1}
    >
      <Box sx={{ mt: 0.25 }}>
        <BrandAvatar size={28} />
      </Box>
      <Stack
        gap={0.75}
        minWidth={0}
        flex={1}
        alignItems="flex-start"
      >
        {turn.text && (
          <Box
            sx={{
              maxWidth: '100%',
              px: 1.75,
              py: 1.25,
              borderRadius: '6px 18px 18px 18px',
              bgcolor: brand.subtle,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <MarkdownContent content={turn.text} />
          </Box>
        )}
        {turn.route && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<OpenInNewRoundedIcon />}
            onClick={() => onNavigate(turn.route!)}
            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
          >
            {turn.routeTitle || 'Abrir'}
          </Button>
        )}
        {turn.done?.map((message) => (
          <Stack
            key={message}
            direction="row"
            alignItems="center"
            gap={0.75}
            sx={{
              px: 1.25,
              py: 0.75,
              borderRadius: 2,
              bgcolor: tint(theme, 'success', 0.1),
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            <TaskAltRoundedIcon sx={{ fontSize: 17, color: 'success.main' }} />
            {message}
          </Stack>
        ))}
        {turn.text && !streaming && (
          <ButtonBase
            onClick={copy}
            aria-label="Copiar la respuesta"
            sx={{
              gap: 0.5,
              px: 0.75,
              py: 0.25,
              borderRadius: 1.5,
              fontSize: 11,
              fontWeight: 600,
              color: copied ? 'success.main' : 'text.secondary',
              '&:hover': { bgcolor: brand.subtle },
            }}
          >
            {copied ? (
              <CheckRoundedIcon sx={{ fontSize: 13 }} />
            ) : (
              <ContentCopyRoundedIcon sx={{ fontSize: 12 }} />
            )}
            {copied ? 'Copiado' : 'Copiar'}
          </ButtonBase>
        )}
      </Stack>
    </Stack>
  );
});

/** Los tres puntitos, con lo que está haciendo al lado. */
const Typing = memo(function Typing({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={0.6}
      aria-label={label || 'Pensando'}
      sx={{
        alignSelf: 'flex-start',
        ml: 4.5,
        px: 1.5,
        py: 1.1,
        borderRadius: '6px 18px 18px 18px',
        bgcolor: tint(theme, 'primary', 0.08),
        fontSize: 12,
        fontWeight: 600,
        color: 'text.secondary',
        '& span': {
          width: 6,
          height: 6,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          animation: 'botDot 1s ease-in-out infinite',
        },
        '& span:nth-of-type(2)': { animationDelay: '0.15s' },
        '& span:nth-of-type(3)': { animationDelay: '0.3s', mr: 0.5 },
        '@keyframes botDot': {
          '0%, 80%, 100%': { opacity: 0.25, transform: 'translateY(0)' },
          '40%': { opacity: 1, transform: 'translateY(-3px)' },
        },
        [NO_MOTION]: { '& span': { animation: 'none', opacity: 0.6 } },
      }}
    >
      <span />
      <span />
      <span />
      {label}
    </Stack>
  );
});

type Props = {
  turns: Turn[];
  busy: boolean;
  /** Qué está haciendo (herramienta en curso o transcribiendo); vacío si nada. */
  activity: string;
  onNavigate: (route: string) => void;
};

/** La conversación. Baja sola al final cuando llega texto nuevo. */
export const BotMessages = memo(function BotMessages({ turns, busy, activity, onNavigate }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const last = turns[turns.length - 1];
  const waiting = busy && !last?.text;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [turns, waiting, activity]);

  return (
    <>
      {turns.map((turn) =>
        turn.from === 'me' ? (
          <MyBubble
            key={turn.id}
            text={turn.text}
          />
        ) : turn.text || turn.route || turn.done?.length ? (
          <BotBubble
            key={turn.id}
            turn={turn}
            streaming={busy && turn === last}
            onNavigate={onNavigate}
          />
        ) : null
      )}
      {(waiting || activity) && <Typing label={activity} />}
      <div ref={endRef} />
    </>
  );
});
