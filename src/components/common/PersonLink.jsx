import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Link as RouterLink } from 'react-router-dom';

import { PersonAvatar } from './PersonAvatar';
import { useAppState } from '@/state/AppState';

/**
 * Route to a person's profile. The signed-in user gets their own page
 * rather than a read-only view of themselves.
 */
export function profilePath(userId, meId) {
  return meId && String(userId) === String(meId) ? '/profile' : `/artists/${userId}`;
}

/**
 * A person, as a link to their profile.
 *
 * Used anywhere a name or avatar appears — chat, hosts, reviews — so that
 * every person in the app is reachable from every mention of them. A small
 * padlock next to a private profile sets expectations before the click,
 * rather than after it.
 */
export default function PersonLink({
  personId,
  size = 32,
  showName = true,
  showPrivacy = true,
  nameVariant = 'subtitle2',
  secondary,
  suffix,
  sx,
}) {
  const { getProfile, user } = useAppState();
  const person = getProfile(personId);
  if (!person) return null;

  const isMe = personId === user?.id;
  const isPrivate = person.visibility === 'private';

  return (
    <Box
      component={RouterLink}
      to={profilePath(personId, user?.id)}
      aria-label={`${isMe ? 'Your' : `${person.name}'s`} profile${isPrivate ? ' (private)' : ''}`}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1.1,
        minWidth: 0,
        textDecoration: 'none',
        color: 'inherit',
        borderRadius: 1,
        '&:hover .pa-person-name': { color: 'primary.main' },
        ...sx,
      }}
    >
      <PersonAvatar personId={personId} size={size} />
      {showName ? (
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
            <Typography
              variant={nameVariant}
              className="pa-person-name"
              noWrap
              sx={{ transition: 'color .15s ease' }}
            >
              {person.name}
            </Typography>
            {showPrivacy && isPrivate ? (
              <LockOutlinedIcon
                sx={{ fontSize: 13, color: 'text.disabled', flexShrink: 0 }}
                titleAccess="Private profile"
              />
            ) : null}
            {suffix}
          </Box>
          {secondary ? (
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
              {secondary}
            </Typography>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}
