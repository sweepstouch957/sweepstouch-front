'use client';

import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import StopRoundedIcon from '@mui/icons-material/StopRounded';
import {
  alpha,
  Box,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { ModelOption } from './ModelOption';
import { AIModel, BASE_AI_MODELS, BaseAIModel } from './models';
import type { useAiChat } from './use-ai-chat';

type Props = Pick<
  ReturnType<typeof useAiChat>,
  | 'input'
  | 'setInput'
  | 'streaming'
  | 'pendingAttachments'
  | 'uploading'
  | 'selectedModel'
  | 'setSelectedModel'
  | 'availableModels'
  | 'attachAnchor'
  | 'setAttachAnchor'
  | 'imageMode'
  | 'setImageMode'
  | 'recording'
  | 'transcribing'
  | 'handlePickVersion'
  | 'fileInputRef'
  | 'imageInputRef'
  | 'inputRef'
  | 'handleFileUpload'
  | 'handleVoice'
  | 'handleStop'
  | 'handleSend'
  | 'handleKeyDown'
>;

/** Caja de texto: adjuntar, modo imagen, dictado por voz y enviar/detener. */
export function ChatComposer({
  input,
  setInput,
  streaming,
  pendingAttachments,
  uploading,
  selectedModel,
  setSelectedModel,
  availableModels,
  attachAnchor,
  setAttachAnchor,
  imageMode,
  setImageMode,
  recording,
  transcribing,
  handlePickVersion,
  fileInputRef,
  imageInputRef,
  inputRef,
  handleFileUpload,
  handleVoice,
  handleStop,
  handleSend,
  handleKeyDown,
}: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const accent = theme.palette.primary.main;
  const imageAccent = theme.palette.info.main;

  return (
    <Box
      sx={{
        p: { xs: 1.25, sm: 2 },
        flexShrink: 0,
        borderTop: `1px solid ${theme.palette.divider}`,
        bgcolor: isDark ? alpha(theme.palette.common.black, 0.15) : theme.palette.background.paper,
      }}
    >
      <input
        type="file"
        ref={imageInputRef}
        hidden
        multiple
        accept="image/*"
        onChange={(e) => handleFileUpload(e, 'image')}
      />
      <input
        type="file"
        ref={fileInputRef}
        hidden
        multiple
        accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.json,.md"
        onChange={(e) => handleFileUpload(e, 'file')}
      />

      {/* Image mode banner */}
      {imageMode && (
        <Box
          sx={{
            mb: 1,
            px: 1.5,
            py: 0.75,
            borderRadius: 2,
            bgcolor: alpha(imageAccent, 0.08),
            border: `1px solid ${alpha(imageAccent, 0.25)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            sx={{ minWidth: 0 }}
          >
            <AutoFixHighRoundedIcon sx={{ fontSize: 15, color: 'info.main' }} />
            <Typography
              variant="caption"
              sx={{
                color: 'info.main',
                fontWeight: 600,
                fontSize: 11,
                overflowWrap: 'anywhere',
              }}
            >
              Image Generation Mode: describe what you want to create
            </Typography>
          </Stack>
          <IconButton
            size="small"
            onClick={() => setImageMode(false)}
            sx={{ p: 0.25 }}
          >
            <CloseRoundedIcon sx={{ fontSize: 14, color: 'info.main' }} />
          </IconButton>
        </Box>
      )}

      <Stack
        direction="row"
        spacing={1}
        alignItems="flex-end"
        useFlexGap
        sx={{ flexWrap: { xs: 'wrap', sm: 'nowrap' }, rowGap: 1 }}
      >
        {/* Attach */}
        <Tooltip title="Attach file">
          <IconButton
            size="small"
            aria-label="Attach file"
            onClick={(e) => setAttachAnchor(e.currentTarget)}
            disabled={uploading || streaming || imageMode}
            sx={{ color: accent, order: { xs: 2, sm: 0 } }}
          >
            {uploading ? <CircularProgress size={18} /> : <AttachFileRoundedIcon />}
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={attachAnchor}
          open={Boolean(attachAnchor)}
          onClose={() => setAttachAnchor(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 160 } } }}
        >
          <MenuItem
            onClick={() => {
              imageInputRef.current?.click();
              setAttachAnchor(null);
            }}
            sx={{ fontSize: 13, gap: 1 }}
          >
            <ImageRoundedIcon sx={{ fontSize: 18, color: accent }} /> Upload Image
          </MenuItem>
          <MenuItem
            onClick={() => {
              fileInputRef.current?.click();
              setAttachAnchor(null);
            }}
            sx={{ fontSize: 13, gap: 1 }}
          >
            <DescriptionRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} /> Upload File
          </MenuItem>
        </Menu>

        {/* Image gen mode toggle */}
        <Tooltip title={imageMode ? 'Exit image mode' : 'Generate image with AI'}>
          <IconButton
            size="small"
            aria-label={imageMode ? 'Exit image mode' : 'Generate image'}
            disabled={streaming}
            onClick={() => setImageMode((v) => !v)}
            sx={{
              order: { xs: 2, sm: 0 },
              color: imageMode ? 'info.main' : 'text.secondary',
              bgcolor: imageMode ? alpha(imageAccent, 0.1) : 'transparent',
              borderRadius: 1.5,
              transition: 'all 0.2s',
              '&:hover': { bgcolor: alpha(imageAccent, 0.12), color: 'info.main' },
            }}
          >
            <AutoFixHighRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>

        {/* Text field */}
        <TextField
          inputRef={inputRef}
          fullWidth
          multiline
          maxRows={4}
          placeholder={
            recording
              ? '🎙 Listening...'
              : transcribing
                ? '⏳ Transcribing...'
                : streaming
                  ? 'Generating...'
                  : imageMode
                    ? 'Describe the image you want to create...'
                    : 'Ask anything about Sweepstouch...'
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={streaming || transcribing}
          variant="outlined"
          size="small"
          sx={{
            order: { xs: 1, sm: 0 },
            flexBasis: { xs: '100%', sm: 'auto' },
            '& .MuiOutlinedInput-root': {
              borderRadius: 2.5,
              fontSize: 13,
              bgcolor: isDark
                ? alpha(theme.palette.common.white, 0.04)
                : alpha(theme.palette.common.black, 0.03),
              ...(imageMode && {
                borderColor: alpha(imageAccent, 0.4),
                '& fieldset': { borderColor: alpha(imageAccent, 0.3) },
              }),
            },
          }}
        />

        <TextField
          select
          value={selectedModel}
          onChange={(e) => {
            const v = e.target.value as string;
            // "proveedor:versión" = eligió una versión concreta del submenú
            if (v.includes(':')) {
              const idx = v.indexOf(':');
              handlePickVersion(v.slice(0, idx) as BaseAIModel, v.slice(idx + 1));
            } else {
              setSelectedModel(v as AIModel);
            }
          }}
          disabled={streaming || transcribing}
          size="small"
          SelectProps={{
            renderValue: (value) => <ModelOption model={value as AIModel} />,
            MenuProps: {
              disablePortal: true,
              anchorOrigin: { vertical: 'top', horizontal: 'left' },
              transformOrigin: { vertical: 'bottom', horizontal: 'left' },
              slotProps: {
                paper: {
                  sx: {
                    mb: 0.75,
                    borderRadius: 2,
                    boxShadow: theme.shadows[6],
                    border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                    overflow: 'auto',
                    maxHeight: 420,
                  },
                },
              },
            },
          }}
          sx={{
            order: { xs: 2, sm: 0 },
            flex: { xs: '1 1 118px', sm: '0 0 auto' },
            minWidth: { xs: 118, sm: 132 },
            '& .MuiOutlinedInput-root': {
              height: 40,
              borderRadius: 2,
              fontSize: 12,
              fontWeight: 700,
              bgcolor: isDark
                ? alpha(theme.palette.common.white, 0.04)
                : alpha(theme.palette.common.black, 0.03),
            },
            '& .MuiSelect-select': {
              display: 'flex',
              alignItems: 'center',
              py: 1,
            },
          }}
        >
          {BASE_AI_MODELS.flatMap((prov) => [
            <MenuItem
              key={prov}
              value={prov}
              sx={{ fontSize: 12, fontWeight: 600 }}
            >
              <ModelOption
                model={prov}
                caption={availableModels?.current?.[prov]}
              />
            </MenuItem>,
            // Versiones concretas del proveedor, en vivo de su API
            ...(availableModels?.[prov] || []).slice(0, 6).map((m) => (
              <MenuItem
                key={`${prov}:${m.id}`}
                value={`${prov}:${m.id}`}
                sx={{
                  fontSize: 11,
                  pl: 5.5,
                  py: 0.5,
                  fontWeight: availableModels?.current?.[prov] === m.id ? 700 : 400,
                }}
              >
                {m.display_name || m.id}
              </MenuItem>
            )),
          ])}
          <MenuItem
            value="combined"
            sx={{ fontSize: 12, fontWeight: 600 }}
          >
            <ModelOption model="combined" />
          </MenuItem>
        </TextField>

        {/* Mic button */}
        <Tooltip title={recording ? 'Stop recording' : 'Voice input'}>
          <IconButton
            size="small"
            aria-label={recording ? 'Stop recording' : 'Voice input'}
            disabled={streaming || transcribing}
            onClick={handleVoice}
            sx={{
              order: { xs: 2, sm: 0 },
              color: recording ? 'error.main' : 'text.secondary',
              bgcolor: recording ? alpha(theme.palette.error.main, 0.1) : 'transparent',
              borderRadius: 1.5,
              width: 34,
              height: 34,
              border: recording
                ? `1.5px solid ${alpha(theme.palette.error.main, 0.4)}`
                : '1.5px solid transparent',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: alpha(theme.palette.error.main, 0.08),
                color: 'error.main',
              },
              ...(recording && {
                animation: 'micPulse 1s ease-in-out infinite',
                '@keyframes micPulse': {
                  '0%, 100%': { boxShadow: `0 0 0 0 ${alpha(theme.palette.error.main, 0)}` },
                  '50%': { boxShadow: `0 0 0 5px ${alpha(theme.palette.error.main, 0.15)}` },
                },
              }),
            }}
          >
            {transcribing ? (
              <CircularProgress
                size={16}
                color="inherit"
              />
            ) : (
              <MicRoundedIcon sx={{ fontSize: 18 }} />
            )}
          </IconButton>
        </Tooltip>

        {/* Send / Stop */}
        {streaming ? (
          <Tooltip title="Stop generating">
            <IconButton
              aria-label="Stop generation"
              onClick={handleStop}
              sx={{
                order: { xs: 2, sm: 0 },
                bgcolor: isDark
                  ? alpha(theme.palette.error.main, 0.15)
                  : alpha(theme.palette.error.main, 0.08),
                color: 'error.main',
                borderRadius: 2,
                width: 38,
                height: 38,
                border: `1.5px solid ${alpha(theme.palette.error.main, 0.3)}`,
                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) },
                animation: 'stopPulse 2s ease-in-out infinite',
                '@keyframes stopPulse': {
                  '0%, 100%': { borderColor: alpha(theme.palette.error.main, 0.3) },
                  '50%': { borderColor: alpha(theme.palette.error.main, 0.7) },
                },
              }}
            >
              <StopRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        ) : (
          <IconButton
            onClick={handleSend}
            disabled={(!input.trim() && pendingAttachments.length === 0) || transcribing}
            sx={{
              order: { xs: 2, sm: 0 },
              bgcolor: imageMode ? 'info.main' : 'primary.main',
              color: 'white',
              borderRadius: 2,
              width: 38,
              height: 38,
              '&:hover': { bgcolor: imageMode ? 'info.dark' : 'primary.dark' },
              '&.Mui-disabled': {
                bgcolor: alpha(imageMode ? imageAccent : theme.palette.primary.main, 0.3),
                color: 'white',
              },
              transition: 'background-color 0.2s',
            }}
          >
            {imageMode ? (
              <AutoFixHighRoundedIcon sx={{ fontSize: 18 }} />
            ) : (
              <SendRoundedIcon sx={{ fontSize: 18 }} />
            )}
          </IconButton>
        )}
      </Stack>

      <Typography
        variant="caption"
        color="text.disabled"
        fontSize={10}
        mt={0.75}
        display="block"
        textAlign="center"
      >
        AI can make mistakes. Verify important information from the platform.
      </Typography>
    </Box>
  );
}
