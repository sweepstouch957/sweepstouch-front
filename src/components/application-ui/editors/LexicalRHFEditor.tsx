'use client';

import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { LinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
  REMOVE_LIST_COMMAND,
} from '@lexical/list';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import LinkIcon from '@mui/icons-material/Link';
import { Box, IconButton, Paper, Stack, Tooltip } from '@mui/material';
import { $getRoot, EditorState, FORMAT_TEXT_COMMAND } from 'lexical';
import * as React from 'react';

type Props = {
  value: string; // HTML string
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  disabled?: boolean;
};

const theme = {
  paragraph: 'lexical-paragraph',
  text: {
    bold: 'lexical-bold',
    italic: 'lexical-italic',
    underline: 'lexical-underline',
  },
};

function setEditorFromHtml(editor: any, html: string) {
  const safe = html?.trim() ? html : '<p></p>';
  const parser = new DOMParser();
  const dom = parser.parseFromString(safe, 'text/html');
  const nodes = $generateNodesFromDOM(editor, dom);

  const root = $getRoot();
  root.clear();
  root.append(...nodes);
}

function Toolbar({ disabled }: { disabled?: boolean }) {
  const [editor] = useLexicalComposerContext();

  const askLink = () => {
    const url = window.prompt('Pega el link (https://...)');
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, url?.trim() ? url.trim() : null);
  };

  return (
    <Stack
      direction="row"
      gap={0.5}
      dir="ltr"
      sx={{
        px: 1,
        py: 0.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        direction: 'ltr', // ✅ evita RTL global
      }}
    >
      <Tooltip title="Bold">
        <span>
          <IconButton
            size="small"
            disabled={disabled}
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
          >
            <FormatBoldIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Italic">
        <span>
          <IconButton
            size="small"
            disabled={disabled}
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
          >
            <FormatItalicIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Underline">
        <span>
          <IconButton
            size="small"
            disabled={disabled}
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
          >
            <FormatUnderlinedIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Bullets">
        <span>
          <IconButton
            size="small"
            disabled={disabled}
            onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
          >
            <FormatListBulletedIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Numerada">
        <span>
          <IconButton
            size="small"
            disabled={disabled}
            onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
          >
            <FormatListNumberedIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Quitar lista">
        <span>
          <IconButton
            size="small"
            disabled={disabled}
            onClick={() => editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)}
          >
            ✕
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Link">
        <span>
          <IconButton
            size="small"
            disabled={disabled}
            onClick={askLink}
          >
            <LinkIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 14,
        left: 14,
        color: 'text.disabled',
        pointerEvents: 'none',
        fontSize: 14,
      }}
    >
      {text}
    </Box>
  );
}

/** Sync HTML externo -> editor (para edit mode) */
function SyncHtml({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext();
  const last = React.useRef<string>('');

  React.useEffect(() => {
    const html = value?.trim() ? value : '<p></p>';
    if (html === last.current) return;
    last.current = html;

    editor.update(() => {
      setEditorFromHtml(editor, html);
    });
  }, [value, editor]);

  return null;
}

export default function LexicalRHFEditor({
  value,
  onChange,
  placeholder = 'Escribe aquí…',
  minHeight = 160,
  disabled,
}: Props) {
  const initialConfig = React.useMemo(
    () => ({
      namespace: 'SweepstakeRulesEditor',
      theme,
      nodes: [ListNode, ListItemNode, LinkNode],
      onError: (e: any) => console.error(e),
      editorState: (editor: any) => {
        editor.update(() => {
          setEditorFromHtml(editor, value || '<p></p>');
        });
      },
      editable: !disabled,
    }),
    // init solo una vez; SyncHtml maneja cambios
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <Paper
      variant="outlined"
      sx={{ overflow: 'hidden' }}
    >
      <LexicalComposer initialConfig={initialConfig}>
        <Toolbar disabled={disabled} />

        {/* ✅ FORZAMOS LTR para evitar RTL global del dashboard */}
        <Box
          dir="ltr"
          sx={{
            position: 'relative',
            p: 1.5,
            bgcolor: 'background.paper',
            direction: 'ltr',
            textAlign: 'left',
          }}
        >
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                style={{
                  minHeight,
                  outline: 'none',
                  fontSize: 14,
                  opacity: disabled ? 0.7 : 1,
                  pointerEvents: disabled ? 'none' : 'auto',
                  direction: 'ltr', // ✅
                  textAlign: 'left', // ✅
                  unicodeBidi: 'plaintext', // ✅
                }}
              />
            }
            placeholder={<Placeholder text={placeholder} />}
            ErrorBoundary={({ children }: any) => children}
          />

          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />

          <OnChangePlugin
            onChange={(editorState: EditorState, editor: any) => {
              editorState.read(() => {
                const html = $generateHtmlFromNodes(editor, null);
                onChange(html);
              });
            }}
          />

          <SyncHtml value={value} />
        </Box>

        <style
          jsx
          global
        >{`
          .lexical-paragraph {
            margin: 0 0 8px 0;
          }
          .lexical-bold {
            font-weight: 700;
          }
          .lexical-italic {
            font-style: italic;
          }
          .lexical-underline {
            text-decoration: underline;
          }
          a {
            color: inherit;
            text-decoration: underline;
          }
          ul,
          ol {
            padding-left: 20px;
            margin: 6px 0;
          }
        `}</style>
      </LexicalComposer>
    </Paper>
  );
}
