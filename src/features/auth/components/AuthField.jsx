import { useId } from 'react';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

/**
 * A labelled auth input.
 *
 * The label sits above the field rather than floating inside it, matching
 * the design and keeping the hit target unambiguous. MUI wires
 * `aria-describedby` to the helper text for us; we only have to make sure
 * the error message *is* the helper text so it is announced rather than
 * just coloured red.
 */
export default function AuthField({
  label,
  icon,
  error,
  helper,
  value,
  onValueChange,
  ...inputProps
}) {
  const id = useId();
  const fieldId = `auth-${id}`;

  return (
    <Box sx={{ mb: 2.25 }}>
      <Typography
        component="label"
        htmlFor={fieldId}
        sx={{ display: 'block', mb: 0.85, fontSize: '0.86rem', fontWeight: 600 }}
      >
        {label}
      </Typography>
      <TextField
        {...inputProps}
        id={fieldId}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        error={Boolean(error)}
        helperText={error || helper || ' '}
        fullWidth
        size="medium"
        slotProps={{
          input: {
            startAdornment: icon ? (
              <InputAdornment position="start" sx={{ color: 'text.disabled', mr: 0.25 }}>
                {icon}
              </InputAdornment>
            ) : undefined,
          },
          formHelperText: { sx: { mx: 0, mt: 0.5, minHeight: 18 } },
        }}
      />
    </Box>
  );
}
