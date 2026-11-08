import Box from '@mui/material/Box';
import { Outlet } from 'react-router-dom';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';

/** Header + page + footer, with the page column capped and centred. */
export default function AppShell() {
  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />
      <Box
        component="main"
        sx={{
          flex: 1,
          width: '100%',
          maxWidth: 1360,
          mx: 'auto',
          px: { xs: 2, md: 4 },
          py: { xs: 2.5, md: 4 },
        }}
      >
        <Outlet />
      </Box>
      <AppFooter />
    </Box>
  );
}
