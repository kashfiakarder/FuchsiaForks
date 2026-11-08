import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';

// Self-hosted type: no external font request and no flash of fallback text
// on a cold or offline network.
import '@fontsource-variable/inter';

import App from './App';
import theme from './theme';
import { AppStateProvider } from './state/AppState';
import ScrollToTop from './components/layout/ScrollToTop';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root was not found in index.html');

createRoot(container).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppStateProvider>
          <ScrollToTop />
          <App />
        </AppStateProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
