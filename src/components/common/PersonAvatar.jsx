import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import { ATTENDEE_SAMPLE, CURRENT_USER, PEOPLE } from '@/data/mockData';

/**
 * A person's initials on their own pastel tint.
 *
 * Initials rather than photographs: there are no real users yet, and
 * inventing faces for a prototype is a quietly dishonest thing to put in
 * front of stakeholders.
 */
export function PersonAvatar({ personId, size = 32, person }) {
  const p = person ?? PEOPLE[personId];
  if (!p) return null;
  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        bgcolor: p.tint,
        color: 'text.primary',
        fontSize: size * 0.36,
        fontWeight: 700,
      }}
      aria-hidden="true"
    >
      {p.initials}
    </Avatar>
  );
}

/**
 * Overlapping stack of attendees, followed by the count as real text.
 *
 * Each avatar links to that person's profile, so the stack is a way into
 * the people at an event rather than decoration. The tooltip carries the
 * name, since initials alone identify nobody.
 */
export function AttendeeStack({ count, size = 30, ids = ATTENDEE_SAMPLE, label = 'artists going' }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <AvatarGroup
        max={4}
        spacing={6}
        sx={{
          '& .MuiAvatar-root': {
            width: size,
            height: size,
            fontSize: size * 0.36,
            borderWidth: 2,
            borderColor: 'background.paper',
          },
        }}
      >
        {ids.map((id) => {
          const person = PEOPLE[id];
          const isMe = id === CURRENT_USER.id;
          const to = isMe ? '/profile' : `/artists/${id}`;
          return (
            <Tooltip key={id} title={isMe ? 'You' : (person?.name ?? '')}>
              <Box
                component={RouterLink}
                to={to}
                aria-label={`${isMe ? 'Your' : `${person?.name}'s`} profile`}
                sx={{ display: 'inline-flex', borderRadius: '50%' }}
              >
                <PersonAvatar personId={id} size={size} />
              </Box>
            </Tooltip>
          );
        })}
      </AvatarGroup>
      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
        {count} {label}
      </Typography>
    </Box>
  );
}
