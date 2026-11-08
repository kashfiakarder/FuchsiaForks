import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import NorthEastRoundedIcon from '@mui/icons-material/NorthEastRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import { Link as RouterLink } from 'react-router-dom';

import SceneImage from '@/components/common/SceneImage';
import { AttendeeStack } from '@/components/common/PersonAvatar';
import { PEOPLE, getSpot } from '@/data/mockData';
import { formatDayNumber, formatMonthAbbr, formatTimeRange, formatWeekdayDate } from '@/data/format';
import { BRAND, RADIUS, cardSx } from '@/theme';

/**
 * The event card used on My Events and Discover.
 *
 * The date badge on the image is decorative duplication — the same date is
 * written out in full in the body below, which is what a screen reader
 * reads. That keeps the glanceable badge without making anyone listen to
 * "NOV 14" twice.
 */
export default function EventCard({ event, status, showActions = true, compact = false }) {
  const spot = getSpot(event.spotId);
  const host = PEOPLE[event.hostId];
  const hosting = status === 'Hosting';

  return (
    <Paper component="article" sx={{ ...cardSx, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ position: 'relative' }}>
        <SceneImage variant={event.scene} height={compact ? 150 : 196} />

        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            bgcolor: 'background.paper',
            borderRadius: `${RADIUS.sm}px`,
            px: 1.25,
            py: 0.6,
            textAlign: 'center',
            minWidth: 48,
            boxShadow: '0 2px 8px rgba(18,18,20,.14)',
          }}
        >
          <Typography variant="overline" sx={{ display: 'block', fontSize: '0.6rem', lineHeight: 1.3 }}>
            {formatMonthAbbr(event.start)}
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1 }}>
            {formatDayNumber(event.start)}
          </Typography>
        </Box>

        {status ? (
          <Chip
            label={status}
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
            to={`/events/${event.id}`}
            underline="none"
            color="text.primary"
            sx={{ '&:hover': { color: 'primary.main' } }}
          >
            {event.title}
          </Link>
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <PlaceRoundedIcon sx={{ fontSize: 17, color: 'primary.main' }} />
          <Link
            component={RouterLink}
            to={`/spots/${spot.id}`}
            variant="body2"
            color="primary.main"
            sx={{ fontWeight: 600 }}
          >
            {spot.name}
          </Link>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
          <CalendarTodayRoundedIcon sx={{ fontSize: 16, color: 'text.secondary', mt: 0.3 }} />
          <Box>
            <Typography variant="body2">{formatWeekdayDate(event.start)}</Typography>
            <Typography variant="caption" color="text.secondary">
              {formatTimeRange(event.start, event.end)}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 0.5 }}>
          <AttendeeStack count={event.attendees} size={27} />
        </Box>

        {showActions ? (
          <>
            <Divider sx={{ mt: 1.25 }} />
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                pt: 0.25,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Hosted by {hosting ? 'You' : host?.name}
              </Typography>
              <Link
                component={RouterLink}
                to={`/events/${event.id}`}
                variant="caption"
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4 }}
              >
                View event
                <NorthEastRoundedIcon sx={{ fontSize: 13 }} />
              </Link>
            </Box>

            <Button
              component={RouterLink}
              to={hosting ? `/events/${event.id}` : `/chats/${event.id}`}
              variant="outlined"
              fullWidth
              startIcon={hosting ? <TuneRoundedIcon /> : <ForumOutlinedIcon />}
              sx={{ mt: 0.75 }}
            >
              {hosting ? 'Manage event' : 'Open chat room'}
            </Button>
          </>
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto', pt: 1 }}>
            Hosted by {hosting ? 'You' : host?.name}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

export { BRAND };
