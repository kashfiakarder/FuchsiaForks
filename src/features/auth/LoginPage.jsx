import { useCallback, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import CircularProgress from '@mui/material/CircularProgress';

import AuthShell from '@/components/layout/AuthShell';
import BrandMark from '@/components/common/BrandMark';
import AuthArtPanel from './AuthArtPanel';
import AuthField from './components/AuthField';
import { EMPTY_LOGIN, formatPhone, validateForm, validateLoginField } from './lib/validation';
import { useAppState } from '@/state/AppState';
import { visuallyHidden } from '@/components/common/visuallyHidden';
import { RADIUS } from '@/theme';

const FIELDS = ['username', 'phone'];

/**
 * Sign in.
 *
 * There is no backend: a valid submission waits a beat, flips the local
 * session flag and routes into the app. Nothing is sent anywhere and no
 * credential is stored. The submit handler is the single place a real API
 * call would go.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAppState();

  const [values, setValues] = useState(EMPTY_LOGIN);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');

  const handleChange = useCallback(
    (name) => (raw) => {
      const value = name === 'phone' ? formatPhone(raw) : raw;
      setValues((prev) => ({ ...prev, [name]: value }));
      // Only ever clear an error while typing. Re-validating on every
      // keystroke means telling someone their input is wrong before they
      // have finished giving it.
      setErrors((prev) => {
        if (!prev[name] || validateLoginField(name, value)) return prev;
        const next = { ...prev };
        delete next[name];
        return next;
      });
    },
    [],
  );

  const handleBlur = (name) => () => {
    const value = values[name];
    if (!value && !errors[name]) return;
    const message = validateLoginField(name, value);
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[name] = message;
      else delete next[name];
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (status !== 'idle') return;

    const found = validateForm(values, FIELDS, validateLoginField);
    if (Object.keys(found).length) {
      setErrors(found);
      requestAnimationFrame(() => {
        document.querySelector('[aria-invalid="true"]')?.focus();
      });
      return;
    }

    setStatus('loading');
    await new Promise((r) => setTimeout(r, 900));
    signIn();
    navigate('/discover');
  };

  const errorCount = Object.keys(errors).length;

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

          <Box component="form" onSubmit={handleSubmit} noValidate>
            {/* Announces the shape of the problem on submit; the per-field
                messages carry the detail. */}
            <Typography aria-live="polite" sx={visuallyHidden}>
              {errorCount
                ? `${errorCount} ${errorCount === 1 ? 'field needs' : 'fields need'} attention.`
                : ''}
            </Typography>

            <AuthField
              label="Username"
              name="username"
              placeholder="Your username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              icon={<PersonOutlineRoundedIcon fontSize="small" />}
              value={values.username}
              onValueChange={handleChange('username')}
              onBlur={handleBlur('username')}
              error={errors.username}
              disabled={status !== 'idle'}
            />

            <AuthField
              label="Phone number"
              name="phone"
              type="tel"
              inputMode="tel"
              placeholder="+1 (403) 000-0000"
              autoComplete="tel"
              icon={<PhoneOutlinedIcon fontSize="small" />}
              value={values.phone}
              onValueChange={handleChange('phone')}
              onBlur={handleBlur('phone')}
              error={errors.phone}
              disabled={status !== 'idle'}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={status !== 'idle'}
              startIcon={
                status === 'loading' ? (
                  <CircularProgress size={17} color="inherit" />
                ) : (
                  <ArrowForwardRoundedIcon />
                )
              }
              sx={{ mt: 0.5 }}
            >
              {status === 'loading' ? 'Signing you in' : 'Log in'}
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
        </Box>
      </Paper>
    </AuthShell>
  );
}
