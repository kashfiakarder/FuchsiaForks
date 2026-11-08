import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import BrandMark from '@/components/common/BrandMark';
import AppFooter from './AppFooter';
import { BRAND } from '@/theme';

/**
 * Chrome for the signed-out pages: a slim bar with the brand and the
 * opposite action, the card in the middle, and the standing footer.
 */
export default function AuthShell({ action, children }) {
  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: `1px solid ${BRAND.line}`,
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: 62, md: 76 },
            px: { xs: 2, md: 4 },
            maxWidth: 1360,
            width: '100%',
            mx: 'auto',
            gap: 2,
          }}
        >
          <BrandMark to="/login" />
          <Box sx={{ flex: 1 }} />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ display: { xs: 'none', md: 'block' } }}
          >
            A little fresh air. A little inspiration.
          </Typography>
          <Button component={RouterLink} to={action.to} variant="outlined">
            {action.label}
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2, md: 4 },
          py: { xs: 3, md: 6 },
        }}
      >
        {children}
      </Box>

      <AppFooter />
    </Box>
  );
}
