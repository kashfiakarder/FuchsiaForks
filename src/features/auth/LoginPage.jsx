import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

import AuthShell from '@/components/layout/AuthShell';
import BrandMark from '@/components/common/BrandMark';
import AuthArtPanel from './AuthArtPanel';
import { RADIUS } from '@/theme';

/**
 * Sign in via Auth0 Universal Login.
 * Keeps the branded shell; credentials are collected by Auth0, not here.
 */
export default function LoginPage() {
  const { loginWithRedirect, isLoading, error } = useAuth0();
  const [status, setStatus] = useState('idle');

  const handleLogin = async () => {
    if (status !== 'idle') return;
    setStatus('loading');
    try {
      await loginWithRedirect({
        appState: { returnTo: '/discover' },
      });
    } catch {
      setStatus('idle');
    }
  };

  const busy = isLoading || status === 'loading';

  return (
    <AuthShell action={{ label: 'Sign up', to: '/signup' }}>
      <Paper
        sx={{
          width: '100%',
          maxWidth: 1120,
          overflow: 'hidden',
          borderRadius: `${RADIUS.xxl}px`,
          boxShadow: '0 1px 2px rgba(18,18,20,.04), 0 24px 56px -28px rgba(18,18,20,.22)',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 560px)' },
        }}
      >
        <AuthArtPanel
          scene="creek"
          caption="Inspired by Calgary. Open to everyone."
          headline="Good views."
          subhead="Even better company."
          place="Fish Creek Provincial Park, Calgary"
        />

        <Box sx={{ p: { xs: 3, sm: 4.5, md: 6 } }}>
          <BrandMark to={null} size={26} fontSize="1.12rem" />

          <Typography variant="h2" component="h1" sx={{ mt: 3.5 }}>
            Find your view.
            <br />
            Paint together.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25, mb: 3.5 }}>
            Welcome back to your creative outdoors.
          </Typography>

          {error ? (
            <Typography variant="body2" color="error" sx={{ mb: 2 }}>
              {error.message || 'Something went wrong signing in.'}
            </Typography>
          ) : null}

          <Button
            type="button"
            variant="contained"
            size="large"
            fullWidth
            disabled={busy}
            onClick={handleLogin}
            startIcon={
              busy ? (
                <CircularProgress size={17} color="inherit" />
              ) : (
                <ArrowForwardRoundedIcon />
              )
            }
            sx={{ mt: 0.5 }}
          >
            {busy ? 'Redirecting' : 'Log in'}
          </Button>

          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2.5 }}>
            New to Fuchsia?{' '}
            <Link component={RouterLink} to="/signup">
              Sign up
            </Link>
          </Typography>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
            By continuing, you agree to our{' '}
            <Link href="#terms" color="inherit" sx={{ fontWeight: 400 }}>
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="#guidelines" color="inherit" sx={{ fontWeight: 400 }}>
              Community Guidelines
            </Link>
            .
          </Typography>
        </Box>
      </Paper>
    </AuthShell>
  );
}
