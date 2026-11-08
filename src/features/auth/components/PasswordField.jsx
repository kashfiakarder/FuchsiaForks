import { useId, useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { scorePassword } from '../lib/validation';
import { visuallyHidden } from '@/components/common/visuallyHidden';

const TONE_COLOR = {
  disabled: 'text.disabled',
  error: 'error.main',
  warning: '#B26A00',
  success: 'success.main',
};

/**
 * Password input with a reveal toggle and an advisory strength meter.
 *
 * Two accessibility details that are easy to get wrong here:
 *  - the toggle keeps one stable label ("Show password") and expresses its
 *    state through `aria-pressed`, rather than renaming itself on each
 *    press, which is what screen readers actually expect;
 *  - the strength tier is mirrored into a polite live region, because four
 *    coloured bars convey nothing on their own.
 */
export default function PasswordField({ value, onValueChange, error, helper, ...inputProps }) {
  const [revealed, setRevealed] = useState(false);
  const id = useId();
  const fieldId = `pw-${id}`;
  const tier = scorePassword(value);
  const color = TONE_COLOR[tier.tone];

  return (
    <Box sx={{ mb: 2.25 }}>
      <Typography
        component="label"
        htmlFor={fieldId}
        sx={{ display: 'block', mb: 0.85, fontSize: '0.86rem', fontWeight: 600 }}
      >
        Password
      </Typography>

      <TextField
        {...inputProps}
        id={fieldId}
        type={revealed ? 'text' : 'password'}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        error={Boolean(error)}
        helperText={error || helper || ' '}
        fullWidth
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start" sx={{ color: 'text.disabled', mr: 0.25 }}>
                <LockOutlinedIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setRevealed((v) => !v)}
                  aria-label="Show password"
                  aria-pressed={revealed}
                  edge="end"
                  size="small"
                >
                  {revealed ? (
                    <VisibilityOffOutlinedIcon fontSize="small" />
                  ) : (
                    <VisibilityOutlinedIcon fontSize="small" />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          },
          formHelperText: { sx: { mx: 0, mt: 0.5, minHeight: 18 } },
        }}
      />

      <Collapse in={value.length > 0} unmountOnExit>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mt: 0.5 }}>
          <Stack direction="row" spacing={0.75} sx={{ flex: 1 }} aria-hidden="true">
            {[1, 2, 3, 4].map((n) => (
              <LinearProgress
                key={n}
                variant="determinate"
                value={n <= tier.score ? 100 : 0}
                sx={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  bgcolor: 'divider',
                  '& .MuiLinearProgress-bar': { bgcolor: color, transition: 'transform .4s ease' },
                }}
              />
            ))}
          </Stack>
          <Typography variant="caption" sx={{ color, fontWeight: 700, whiteSpace: 'nowrap' }}>
            {tier.label}
          </Typography>
        </Stack>
        <Typography aria-live="polite" sx={visuallyHidden}>
          Password strength: {tier.label}
        </Typography>
        {tier.hint ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
            {tier.hint}
          </Typography>
        ) : null}
      </Collapse>
    </Box>
  );
}
