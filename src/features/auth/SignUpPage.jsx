import { useCallback, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';

import AuthShell from '@/components/layout/AuthShell';
import BrandMark from '@/components/common/BrandMark';
import AuthArtPanel from './AuthArtPanel';
import AuthField from './components/AuthField';
import PasswordField from './components/PasswordField';
import { EMPTY_SIGNUP, formatPhone, validateField, validateForm } from './lib/validation';
import { useAppState } from '@/state/AppState';
import { visuallyHidden } from '@/components/common/visuallyHidden';
import { RADIUS } from '@/theme';

const FIELDS = ['username', 'email', 'phone', 'password'];

/**
 * Create an account.
 *
 * Carries the four fields the product needs — username, email, phone,
 * password — and nothing else. No credential is transmitted or stored;
 * `handleSubmit` is where a real registration call belongs.
 */
export default function SignUpPage() {
  const navigate = useNavigate();
  const { signIn } = useAppState();

  const [values, setValues] = useState(EMPTY_SIGNUP);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');

  const handleChange = useCallback(
    (name) => (raw) => {
      const value = name === 'phone' ? formatPhone(raw) : raw;
      setValues((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => {
        if (!prev[name] || validateField(name, value)) return prev;
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
    const message = validateField(name, value);
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

    const found = validateForm(values, FIELDS);
    if (Object.keys(found).length) {
      setErrors(found);
      requestAnimationFrame(() => {
        document.querySelector('[aria-invalid="true"]')?.focus();
      });
      return;
    }

    setStatus('loading');
    await new Promise((r) => setTimeout(r, 1000));
    signIn();
    navigate('/discover');
  };

  const errorCount = Object.keys(errors).length;

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

        <Box sx={{ p: { xs: 3, sm: 4.5, md: 5.5 } }}>
          <BrandMark to={null} size={26} fontSize="1.12rem" />

          <Typography variant="h2" component="h1" sx={{ mt: 3 }}>
            Make something
            <br />
            outside.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25, mb: 3 }}>
            Two minutes, and the city opens up.
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Typography aria-live="polite" sx={visuallyHidden}>
              {errorCount
                ? `${errorCount} ${errorCount === 1 ? 'field needs' : 'fields need'} attention.`
                : ''}
            </Typography>

            <AuthField
              label="Username"
              name="username"
              placeholder="Pick a username"
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
              label="Email address"
              name="email"
              type="email"
              inputMode="email"
              placeholder="you@example.com"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              icon={<MailOutlineRoundedIcon fontSize="small" />}
              value={values.email}
              onValueChange={handleChange('email')}
              onBlur={handleBlur('email')}
              error={errors.email}
              disabled={status !== 'idle'}
            />

            <AuthField
              label="Phone number"
              name="phone"
              type="tel"
              inputMode="tel"
              placeholder="+1 (403) 000-0000"
              autoComplete="tel"
              helper="For meetup reminders. Never shown on your profile."
              icon={<PhoneOutlinedIcon fontSize="small" />}
              value={values.phone}
              onValueChange={handleChange('phone')}
              onBlur={handleBlur('phone')}
              error={errors.phone}
              disabled={status !== 'idle'}
            />

            <PasswordField
              name="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              value={values.password}
              onValueChange={handleChange('password')}
              onBlur={handleBlur('password')}
              error={errors.password}
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
              sx={{ mt: 1 }}
            >
              {status === 'loading' ? 'Setting up your studio' : 'Create account'}
            </Button>

            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2.5 }}>
              Already have an account?{' '}
              <Link component={RouterLink} to="/login">
                Log in
              </Link>
            </Typography>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2.5 }}>
              By creating an account you agree to our{' '}
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
