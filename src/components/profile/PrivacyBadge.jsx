import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import { BRAND } from '@/theme';

const COPY = {
  public: {
    label: 'Public profile',
    short: 'Public',
    hint: 'Anyone on Fuchsia can see this gallery.',
  },
  private: {
    label: 'Private profile',
    short: 'Private',
    hint: 'Only this artist can see their gallery.',
  },
};

/**
 * Says whether a profile is public or private.
 *
 * The icon is never the only signal — the word is always there too, so the
 * state does not depend on recognising a padlock, and it reaches a screen
 * reader as text rather than as decoration.
 */
export default function PrivacyBadge({ visibility = 'public', size = 'small', compact = false, ownHint }) {
  const copy = COPY[visibility] ?? COPY.public;
  const isPrivate = visibility === 'private';
  const Icon = isPrivate ? LockOutlinedIcon : PublicRoundedIcon;

  return (
    <Tooltip title={ownHint ?? copy.hint}>
      <Chip
        size={size}
        icon={<Icon sx={{ fontSize: 15 }} />}
        label={compact ? copy.short : copy.label}
        sx={{
          fontWeight: 700,
          fontSize: '0.72rem',
          bgcolor: isPrivate ? BRAND.magentaSoft : 'transparent',
          border: `1px solid ${isPrivate ? BRAND.magentaBorder : BRAND.line}`,
          color: isPrivate ? BRAND.magentaDark : 'text.secondary',
          '& .MuiChip-icon': { color: 'inherit', ml: 0.75 },
        }}
      />
    </Tooltip>
  );
}
