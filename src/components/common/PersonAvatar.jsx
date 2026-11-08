import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ATTENDEE_SAMPLE, PEOPLE } from '@/data/mockData';

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

/** Overlapping stack of attendees, followed by the count as real text. */
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
        {ids.map((id) => (
          <PersonAvatar key={id} personId={id} size={size} />
        ))}
      </AvatarGroup>
      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
        {count} {label}
      </Typography>
    </Box>
  );
}
