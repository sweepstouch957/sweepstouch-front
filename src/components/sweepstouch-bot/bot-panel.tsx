'use client';

import { alpha, Grow, Paper, Stack, useTheme } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { BotComposer } from './bot-composer';
import { BotHeader } from './bot-header';
import { BotMessages } from './bot-messages';
import { BotToolbar } from './bot-toolbar';
import { BotWelcome } from './bot-welcome';
import { useBrand } from './brand';
import { useBotChat } from './use-bot-chat';
import { useDictation, useVoiceMode } from './use-bot-voice';
import { VoiceOrb } from './voice-orb';

export type BotPanelProps = {
  open: boolean;
  pathname: string;
  pageName: string;
  chatRoute: string;
  /** Posición del botón flotante: el panel se ancla encima. */
  anchor: { right: string; bottom: string };
  onClose: () => void;
};

/**
 * El panel de Sweepstouch Bot: une la conversación y la voz (hooks) con las vistas.
 * Es el único que conoce estado y navegación; las piezas reciben todo por props.
 * Se carga la primera vez que se abre y queda montado, así cerrar no borra la charla.
 */
export default function BotPanel({
  open,
  pathname,
  pageName,
  chatRoute,
  anchor,
  onClose,
}: BotPanelProps) {
  const theme = useTheme();
  const brand = useBrand();
  const { push } = useRouter();

  const chat = useBotChat(
    `estoy en la pantalla "${pageName || pathname}" del panel, ruta ${pathname}`
  );
  const { ask, stop, reset, notify } = chat;
  const voiceMode = useVoiceMode({ ask, stop, notify });
  const dictation = useDictation({ ask, notify });
  const { voice, startVoice, stopVoice } = voiceMode;
  const voiceOn = voice !== 'off';

  // Cerrar el panel corta la conversación por voz: no se queda escuchando a escondidas.
  useEffect(() => {
    if (!open) stopVoice();
  }, [open, stopVoice]);

  const send = useCallback((text: string) => void ask(text), [ask]);
  const toggleVoice = useCallback(
    () => (voiceOn ? stopVoice() : void startVoice()),
    [voiceOn, startVoice, stopVoice]
  );
  const startOver = useCallback(() => {
    stopVoice();
    reset();
  }, [stopVoice, reset]);

  return (
    <Grow
      in={open}
      style={{ transformOrigin: 'bottom right' }}
    >
      <Paper
        role="dialog"
        aria-label="Sweepstouch Bot"
        aria-hidden={!open}
        elevation={0}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        sx={{
          position: 'fixed',
          zIndex: theme.zIndex.speedDial,
          right: anchor.right,
          bottom: `calc(${anchor.bottom} + 72px)`,
          width: { xs: 'calc(100vw - 24px)', sm: 420 },
          maxWidth: 'calc(100vw - 24px)',
          // Nunca más alto que la ventana: deja libre la barra superior del panel.
          height: 'min(640px, calc(100dvh - 180px))',
          minHeight: 360,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 4,
          border: `1px solid ${theme.palette.divider}`,
          backgroundImage: 'none',
          boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.12)}`,
        }}
      >
        <BotHeader
          pageName={pageName}
          chatRoute={chatRoute}
          canReset={chat.turns.length > 0}
          onReset={startOver}
          onClose={onClose}
        />
        <BotToolbar
          model={chat.model}
          speak={chat.speak}
          voiceOn={voiceOn}
          onPickModel={chat.pickModel}
          onToggleSpeak={chat.toggleSpeak}
          onToggleVoice={toggleVoice}
        />
        {voiceOn && (
          <VoiceOrb
            voice={voice}
            status={chat.status}
            orbRef={voiceMode.orbRef}
            onTap={voiceMode.tapOrb}
          />
        )}

        <Stack
          gap={1.5}
          aria-live="polite"
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            px: 1.75,
            py: 1.75,
            scrollbarWidth: 'thin',
            scrollbarColor: `${brand.glow(0.3)} transparent`,
          }}
        >
          {chat.turns.length === 0 && !voiceOn && (
            <BotWelcome
              firstName={chat.firstName}
              pageName={pageName}
              onAsk={send}
            />
          )}
          <BotMessages
            turns={chat.turns}
            busy={chat.busy}
            activity={dictation.transcribing ? 'Transcribiendo el audio…' : chat.status}
            onNavigate={push}
          />
        </Stack>

        <BotComposer
          focused={open}
          busy={chat.busy}
          recording={dictation.recording}
          transcribing={dictation.transcribing}
          micLocked={voiceOn}
          onSend={send}
          onStop={stop}
          onToggleDictation={dictation.toggleDictation}
        />
      </Paper>
    </Grow>
  );
}
