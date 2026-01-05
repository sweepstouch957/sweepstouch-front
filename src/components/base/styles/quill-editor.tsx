'use client';

import { alpha, styled } from '@mui/material/styles';
import * as React from 'react';

type QuillModuleConfig = {
  toolbar?: any;
  [key: string]: any;
};

export type QuillEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  placeholder?: string;
  modules?: QuillModuleConfig;
  /** Quill theme name (NOT the MUI theme). */
  quillTheme?: 'snow' | 'bubble';
  sx?: any;
  style?: React.CSSProperties;
};

const DEFAULT_TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
  ['link', 'clean'],
];

function QuillEditorBase(props: QuillEditorProps) {
  const {
    value = '',
    onChange,
    onFocus,
    placeholder,
    modules,
    quillTheme = 'snow',
    ...rest
  } = props;

  const mountRef = React.useRef<HTMLDivElement | null>(null);
  const quillRef = React.useRef<any>(null);
  const lastEmittedHtmlRef = React.useRef<string>(value || '');

  // Mount Quill once
  React.useEffect(() => {
    let isActive = true;

    (async () => {
      if (!mountRef.current) return;

      const quillImport: any = await import('quill');
      const Quill = quillImport?.default ?? quillImport;

      if (!isActive || !mountRef.current) return;

      const q = new Quill(mountRef.current, {
        theme: quillTheme,
        placeholder,
        modules: {
          toolbar: modules?.toolbar ?? DEFAULT_TOOLBAR,
          ...(modules || {}),
        },
      });

      quillRef.current = q;

      // Set initial content
      if (value) {
        q.clipboard.dangerouslyPasteHTML(value);
      } else {
        q.setText('');
      }

      const handleTextChange = () => {
        const html = q?.root?.innerHTML ?? '';
        lastEmittedHtmlRef.current = html;
        onChange?.(html);
      };

      const handleSelectionChange = (range: any) => {
        if (range) onFocus?.();
      };

      q.on('text-change', handleTextChange);
      q.on('selection-change', handleSelectionChange);

      // Cleanup
      return () => {
        try {
          q.off('text-change', handleTextChange);
          q.off('selection-change', handleSelectionChange);
        } catch {
          // ignore
        }
      };
    })();

    return () => {
      isActive = false;

      // Destroy DOM that Quill injected to avoid duplicate toolbars on remount
      if (mountRef.current) {
        mountRef.current.innerHTML = '';
      }

      quillRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep editor in sync if parent value changes externally
  React.useEffect(() => {
    const q = quillRef.current;
    if (!q) return;

    const current = q?.root?.innerHTML ?? '';
    const next = value || '';

    // Avoid feedback loops: if this exact HTML was just emitted, skip.
    if (next === current || next === lastEmittedHtmlRef.current) return;

    const selection = q.getSelection?.();
    q.clipboard.dangerouslyPasteHTML(next);
    if (selection) q.setSelection(selection);
  }, [value]);

  return (
    <div {...rest}>
      <div ref={mountRef} />
    </div>
  );
}

export const QuillEditor = styled(QuillEditorBase, {
  // Prevent Quill theme string from colliding with the injected MUI theme prop.
  shouldForwardProp: (prop) => prop !== 'quillTheme',
})(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  boxShadow:
    theme.palette.mode === 'dark'
      ? `${alpha(theme.palette.neutral[900], 0.3)} 0 1px 3px !important`
      : `${alpha(theme.palette.neutral[400], 0.3)} 0 1px 3px !important`,
  backgroundColor:
    theme.palette.mode === 'dark' ? theme.palette.neutral[900] : theme.palette.background.paper,
  border:
    theme.palette.mode === 'dark'
      ? `${theme.palette.neutral[800]} solid 1px !important`
      : `${theme.palette.neutral[400]} solid 1px !important`,
  borderRadius: theme.shape.borderRadius,

  '& .quill': {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    overflow: 'hidden',
    borderRadius: 'inherit',
  },
  '& .ql-snow.ql-toolbar': {
    borderColor:
      theme.palette.mode === 'dark' ? theme.palette.neutral[800] : theme.palette.neutral[400],
    borderLeft: 'none',
    borderRight: 'none',
    borderTop: 'none',
    '& .ql-picker-label:hover': {
      color: theme.palette.primary.main,
    },
    '& .ql-picker-label.ql-active': {
      color: theme.palette.primary.main,
    },
    '& .ql-picker-item:hover': {
      color: theme.palette.primary.main,
    },
    '& .ql-picker-item.ql-selected': {
      color: theme.palette.primary.main,
    },
    '& button': {
      height: 34,
      width: 34,
      padding: theme.spacing(0.8),
      borderRadius: theme.shape.borderRadius + 'px',
      '&:hover': {
        color: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.12),
        '& .ql-stroke': {
          stroke: theme.palette.primary.main,
        },
      },
    },
    '& button:focus': {
      color: theme.palette.primary.main,
      '& .ql-stroke': {
        stroke: theme.palette.primary.main,
      },
    },
    '& button.ql-active': {
      '& .ql-stroke': {
        stroke: theme.palette.primary.main,
      },
    },
    '& .ql-stroke': {
      stroke: theme.palette.text.primary,
    },
    '& .ql-picker': {
      color: theme.palette.text.primary,
    },
    '& .ql-picker-options': {
      backgroundColor: theme.palette.background.paper,
      border: 'none',
      borderRadius: theme.shape.borderRadius,
      boxShadow: theme.shadows[10],
      padding: theme.spacing(2),
    },
  },
  '& .ql-snow.ql-container': {
    borderBottom: 'none',
    borderColor: theme.palette.neutral[400],
    borderLeft: 'none',
    borderRight: 'none',
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    height: 'auto',
    overflow: 'hidden',
    '& .ql-editor': {
      color: theme.palette.text.primary,
      background:
        theme.palette.mode === 'dark'
          ? alpha(theme.palette.neutral[25], 0.02)
          : theme.palette.neutral[25],
      flex: 1,
      fontFamily: theme.typography.body1.fontFamily,
      fontSize: theme.typography.body1.fontSize,
      height: 'auto',
      overflowY: 'auto',
      padding: theme.spacing(2),
      borderBottomLeftRadius: theme.shape.borderRadius + 'px',
      borderBottomRightRadius: theme.shape.borderRadius + 'px',

      '&:focus': {
        background: theme.palette.background.paper,
      },

      '&.ql-blank::before': {
        color: theme.palette.text.secondary,
        fontStyle: 'normal',
        left: theme.spacing(2),
      },
    },
  },
}));
