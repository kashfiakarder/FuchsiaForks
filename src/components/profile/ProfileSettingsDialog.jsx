import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';

import { useAppState } from '@/state/AppState';
import { BRAND, RADIUS } from '@/theme';

const OPTIONS = [
  {
    value: 'public',
    icon: PublicRoundedIcon,
    title: 'Public',
    body: 'Anyone on Fuchsia can see your profile and your art gallery.',
  },
  {
    value: 'private',
    icon: LockOutlinedIcon,
    title: 'Private',
    body: 'People can find you and see your name, but only you can see your gallery.',
  },
];

/** One selectable privacy card. */
function VisibilityOption({ option, selected, onSelect }) {
  const Icon = option.icon;
  return (
    <Paper
      component="button"
      type="button"
      onClick={() => onSelect(option.value)}
      aria-pressed={selected}
      sx={{
        flex: 1,
        p: 2,
        textAlign: 'left',
        font: 'inherit',
        cursor: 'pointer',
        borderRadius: `${RADIUS.md}px`,
        border: `1.5px solid ${selected ? BRAND.magenta : BRAND.line}`,
        bgcolor: selected ? BRAND.magentaSoft : 'background.paper',
        transition: 'border-color .15s ease, background-color .15s ease',
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 0.75 }}>
        <Icon sx={{ fontSize: 19, color: selected ? BRAND.magentaDark : 'text.secondary' }} />
        <Typography variant="subtitle2" sx={{ color: selected ? BRAND.magentaDark : 'text.primary' }}>
          {option.title}
        </Typography>
        {selected ? (
          <CheckRoundedIcon sx={{ fontSize: 17, color: BRAND.magentaDark, ml: 'auto' }} />
        ) : null}
      </Stack>
      <Typography variant="caption" color="text.secondary">
        {option.body}
      </Typography>
    </Paper>
  );
}

/**
 * Edit your own profile, including who can see your gallery.
 *
 * Privacy sits at the top rather than buried under the bio fields,
 * because it is the setting with consequences. Nothing is applied until
 * Save, so backing out of the dialog changes nothing.
 */
export default function ProfileSettingsDialog({ open, onClose }) {
  const { user, updateProfile, setVisibility } = useAppState();
  const [draft, setDraft] = useState(user);

  // Re-read on open so a cancelled edit never persists into the next one.
  useEffect(() => {
    if (open) setDraft(user);
  }, [open, user]);

  const set = (name) => (event) => setDraft((prev) => ({ ...prev, [name]: event.target.value }));

  const save = () => {
    const { visibility, ...rest } = draft;
    updateProfile({
      name: rest.name.trim() || user.name,
      pronouns: rest.pronouns.trim(),
      city: rest.city.trim(),
      bio: rest.bio.trim(),
      mediums: String(rest.mediums)
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean),
    });
    if (visibility !== user.visibility) setVisibility(visibility);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="settings-title">
      <DialogContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography id="settings-title" variant="h2" sx={{ fontSize: '1.6rem' }}>
              Profile settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              How you appear to the rest of Fuchsia.
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close" size="small" sx={{ mt: -0.5, mr: -0.5 }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Typography variant="subtitle2" sx={{ mb: 1.25 }}>
          Who can see your gallery
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3.5 }}>
          {OPTIONS.map((option) => (
            <VisibilityOption
              key={option.value}
              option={option}
              selected={draft.visibility === option.value}
              onSelect={(v) => setDraft((prev) => ({ ...prev, visibility: v }))}
            />
          ))}
        </Stack>

        <Divider sx={{ mb: 3 }} />

        <Stack spacing={2.25}>
          <TextField label="Display name" value={draft.name ?? ''} onChange={set('name')} fullWidth />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField label="Pronouns" value={draft.pronouns ?? ''} onChange={set('pronouns')} fullWidth />
            <TextField label="Location" value={draft.city ?? ''} onChange={set('city')} fullWidth />
          </Stack>
          <TextField
            label="Mediums"
            value={Array.isArray(draft.mediums) ? draft.mediums.join(', ') : (draft.mediums ?? '')}
            onChange={set('mediums')}
            helperText="Comma separated — Watercolour, Gouache, Ink"
            fullWidth
          />
          <TextField
            label="Bio"
            value={draft.bio ?? ''}
            onChange={set('bio')}
            multiline
            minRows={3}
            fullWidth
          />
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: { xs: 2.5, sm: 3.5 }, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={save} variant="contained">
          Save changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
