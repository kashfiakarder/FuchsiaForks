import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import NorthEastRoundedIcon from '@mui/icons-material/NorthEastRounded';
import RouteRoundedIcon from '@mui/icons-material/RouteRounded';
import { Link as RouterLink } from 'react-router-dom';

import SceneImage from '@/components/common/SceneImage';
import { AttendeeStack } from '@/components/common/PersonAvatar';
import JoinRouteButton from '@/components/events/JoinRouteButton';
import { memberIds, membership, stopsFor } from '@/lib/routes';
import { useAppState } from '@/state/AppState';
import { RADIUS, cardSx } from '@/theme';

const BADGE = {
  host: 'Hosting',
  joined: 'Joined',
  invited: 'Invited',
};

/**
 * A painting route, as it appears on Discover and on a person's profile.
 *
 * `badgeFor` is whose relationship the chip describes. On Discover that is
 * you. On a profile it is the person whose page you are reading. The button
 * is always your own action: join, leave, or open a route you planned.
 */
export default function RouteCard({ route, badgeFor }) {
  const { user, getSpot, getProfile, leaveRoute } = useAppState();
  const [busy, setBusy] = useState(false);

  const stops = stopsFor(route)
    .map((stop) => getSpot(stop.spotId))
    .filter(Boolean);
  const lead = stops[0];
  const people = memberIds(route);
  const host = getProfile(route.hostId);
  const mine = membership(route, user?.id);
  const shown = membership(route, badgeFor ?? user?.id);
  const hosting = mine === 'host';

  const path =
    stops.length <= 2
      ? stops.map((spot) => spot.name).join(' → ')
      : `${stops[0].name} → ${stops[stops.length - 1].name}`;

  const go = async (action) => {
    setBusy(true);
    await action(route.id);
    setBusy(false);
  };

  return (
    <Paper component="article" sx={{ ...cardSx, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ position: 'relative' }}>
        <SceneImage variant={lead?.scene || 'creek'} slug={lead?.slug} height={168} />
        <Chip
          icon={<RouteRoundedIcon />}
          label={`${stops.length} ${stops.length === 1 ? 'stop' : 'stops'}`}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            bgcolor: 'background.paper',
            fontSize: '0.74rem',
            boxShadow: '0 2px 8px rgba(18,18,20,.12)',
            '& .MuiChip-icon': { fontSize: 16, ml: 0.75 },
          }}
        />
        {shown ? (
          <Chip
            label={BADGE[shown]}
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              bgcolor: 'background.paper',
              fontSize: '0.74rem',
              boxShadow: '0 2px 8px rgba(18,18,20,.12)',
            }}
          />
        ) : null}
      </Box>

      <Box sx={{ p: 2.25, display: 'flex', flexDirection: 'column', flex: 1, gap: 1.1 }}>
        <Typography variant="h4" component="h3">
          <Link
            component={RouterLink}
            to={`/routes?route=${route.id}`}
            underline="none"
            color="text.primary"
            sx={{ '&:hover': { color: 'primary.main' } }}
          >
            {route.name}
          </Link>
        </Typography>

        {path ? (
          <Typography variant="body2" color="text.secondary">
            {path}
          </Typography>
        ) : null}

        {route.description ? (
          <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {route.description}
          </Typography>
        ) : null}

        <Box sx={{ mt: 0.5 }}>
          <AttendeeStack count={people.length} ids={people} size={27} label="on this route" />
        </Box>

        <Divider sx={{ mt: 'auto', pt: 1.25 }} />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Planned by {hosting ? 'you' : host?.name || 'someone'}
          </Typography>
          <Link
            component={RouterLink}
            to={`/routes?route=${route.id}`}
            variant="caption"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, flexShrink: 0 }}
          >
            View route
            <NorthEastRoundedIcon sx={{ fontSize: 13 }} />
          </Link>
        </Box>

        {hosting ? (
          <Button
            component={RouterLink}
            to={`/routes?route=${route.id}`}
            variant="outlined"
            fullWidth
            sx={{ mt: 0.25, borderRadius: `${RADIUS.md}px` }}
          >
            Open route
          </Button>
        ) : mine === 'joined' ? (
          <Button
            variant="outlined"
            fullWidth
            disabled={busy}
            onClick={() => go(leaveRoute)}
            sx={{ mt: 0.25 }}
          >
            {busy ? 'Leaving…' : 'Leave route'}
          </Button>
        ) : (
          <JoinRouteButton
            routeId={route.id}
            fullWidth
            label={mine === 'invited' ? 'Accept invite' : 'Join route'}
            hint="Take a photo to confirm you joined."
            sx={{ mt: 0.25 }}
          />
        )}
      </Box>
    </Paper>
  );
}
