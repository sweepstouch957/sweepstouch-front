'use client';

import { alpha, Box, Drawer, useMediaQuery, useTheme } from '@mui/material';
import { headerOffset } from 'src/theme/utils';
import { ChatComposer } from './ChatComposer';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ConversationSidebar } from './ConversationSidebar';
import { DeleteConversationDialog } from './DeleteConversationDialog';
import { PendingAttachments } from './PendingAttachments';
import { useAiChat } from './use-ai-chat';

// Altura del chat: lo que queda bajo el navbar, medido por la cabecera
const chatHeight = {
  xs: `calc(100dvh - ${headerOffset})`,
  md: `calc(100vh - ${headerOffset})`,
};

/**
 * Asistente IA: arma la pantalla (barra de conversaciones + chat). La lógica vive en
 * useAiChat; cada pieza de la vista es su propio componente.
 */
export default function AIAssistant() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));
  const {
    user,
    conversations,
    activeConvId,
    messages,
    input,
    setInput,
    streaming,
    streamingText,
    combinedResponses,
    pendingAttachments,
    setPendingAttachments,
    uploading,
    sidebarOpen,
    setSidebarOpen,
    loadingConvs,
    selectedModel,
    setSelectedModel,
    availableModels,
    attachAnchor,
    setAttachAnchor,
    deleteTarget,
    setDeleteTarget,
    imageMode,
    setImageMode,
    recording,
    transcribing,
    handlePickVersion,
    fileInputRef,
    imageInputRef,
    scrollRef,
    inputRef,
    isAdmin,
    loadConversation,
    handleNewConversation,
    handleDeleteRequest,
    handleDeleteConfirm,
    handleFileUpload,
    handleVoice,
    handleStop,
    handleSend,
    handleKeyDown,
  } = useAiChat({ mdUp });

  const SIDEBAR_W = 280;

  const sidebarContent = (
    <ConversationSidebar
      conversations={conversations}
      activeConvId={activeConvId}
      setSidebarOpen={setSidebarOpen}
      loadingConvs={loadingConvs}
      isAdmin={isAdmin}
      loadConversation={loadConversation}
      handleNewConversation={handleNewConversation}
      handleDeleteRequest={handleDeleteRequest}
    />
  );

  return (
    <Box
      sx={{ display: 'flex', width: '100%', height: chatHeight, minWidth: 0, overflow: 'hidden' }}
    >
      {mdUp && (
        <Box
          sx={{
            width: SIDEBAR_W,
            minWidth: SIDEBAR_W,
            flexShrink: 0,
            borderRight: `1px solid ${theme.palette.divider}`,
            bgcolor: isDark
              ? alpha(theme.palette.common.black, 0.2)
              : alpha(theme.palette.common.black, 0.015),
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          {sidebarContent}
        </Box>
      )}

      {!mdUp && (
        <Drawer
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          PaperProps={{ sx: { width: 'min(88vw, 280px)' } }}
        >
          {sidebarContent}
        </Drawer>
      )}

      {/* Main chat column */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <ChatHeader
          activeConvId={activeConvId}
          streaming={streaming}
          setSidebarOpen={setSidebarOpen}
          selectedModel={selectedModel}
        />

        <ChatMessages
          user={user}
          messages={messages}
          setInput={setInput}
          streaming={streaming}
          streamingText={streamingText}
          combinedResponses={combinedResponses}
          setImageMode={setImageMode}
          scrollRef={scrollRef}
          inputRef={inputRef}
        />

        <PendingAttachments
          input={input}
          pendingAttachments={pendingAttachments}
          setPendingAttachments={setPendingAttachments}
        />

        <ChatComposer
          input={input}
          setInput={setInput}
          streaming={streaming}
          pendingAttachments={pendingAttachments}
          uploading={uploading}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          availableModels={availableModels}
          attachAnchor={attachAnchor}
          setAttachAnchor={setAttachAnchor}
          imageMode={imageMode}
          setImageMode={setImageMode}
          recording={recording}
          transcribing={transcribing}
          handlePickVersion={handlePickVersion}
          fileInputRef={fileInputRef}
          imageInputRef={imageInputRef}
          inputRef={inputRef}
          handleFileUpload={handleFileUpload}
          handleVoice={handleVoice}
          handleStop={handleStop}
          handleSend={handleSend}
          handleKeyDown={handleKeyDown}
        />
      </Box>

      <DeleteConversationDialog
        messages={messages}
        deleteTarget={deleteTarget}
        setDeleteTarget={setDeleteTarget}
        handleDeleteConfirm={handleDeleteConfirm}
      />
    </Box>
  );
}
