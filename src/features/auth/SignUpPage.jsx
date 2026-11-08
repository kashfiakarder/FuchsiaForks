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
 * Create an account via Auth0 Universal Login (signup screen hint).
 */
export default function SignUpPage() {
  const { loginWithRedirect, isLoading, error } = useAuth0();
  const [status, setStatus] = useState('idle');

  const handleSignup = async () => {
    if (status !== 'idle') return;
    setStatus('loading');
    try {
      await loginWithRedirect({
        authorizationParams: { screen_hint: 'signup' },
        appState: { returnTo: '/discover' },
      });
    } catch {
      setStatus('idle');
    }
  };

  const busy = isLoading || status === 'loading';

  return (
    <AuthShell action={{ label: 'Log in', to: '/login' }}>
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
          scene="reservoir"
          caption="New here? You’ll fit right in."
          headline="Bring a sketchbook."
          subhead="Leave with a group."
          place="North Glenmore Park, Calgary"
        />

        <Box sx={{ p: { xs: 3, sm: 4.5, md: 6 } }}>
          <BrandMark to={null} size={26} fontSize="1.12rem" />

          <Typography variant="h2" component="h1" sx={{ mt: 3.5 }}>
            Create your
            <br />
            account.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25, mb: 3.5 }}>
            Sign up securely — we&apos;ll take you to Auth0 to finish.
          </Typography>

          {error ? (
            <Typography variant="body2" color="error" sx={{ mb: 2 }}>
              {error.message || 'Something went wrong signing up.'}
            </Typography>
          ) : null}

          <Button
            type="button"
            variant="contained"
            size="large"
            fullWidth
            disabled={busy}
            onClick={handleSignup}
            startIcon={
              busy ? (
                <CircularProgress size={17} color="inherit" />
              ) : (
                <ArrowForwardRoundedIcon />
              )
            }
            sx={{ mt: 0.5 }}
          >
            {busy ? 'Redirecting' : 'Sign up'}
          </Button>

          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2.5 }}>
            Already have an account?{' '}
            <Link component={RouterLink} to="/login">
              Log in
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
