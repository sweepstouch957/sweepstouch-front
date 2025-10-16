
'use client';

import * as React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CreateStoreStep2 from '@/components/admin/stores/CreateStoreStep2';

const pinkTheme = createTheme({
  palette: {
    primary: { main: '#FF008A' },
    secondary: { main: '#FF4D9E' },
  },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 8, textTransform: 'none' } } },
  },
});

export default function Page() {
  return (
    <ThemeProvider theme={pinkTheme}>
      <CreateStoreStep2 />
    </ThemeProvider>
  );
}
