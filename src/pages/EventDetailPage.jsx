import { useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import BackpackOutlinedIcon from '@mui/icons-material/BackpackOutlined';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import NorthEastRoundedIcon from '@mui/icons-material/NorthEastRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import WbTwilightRoundedIcon from '@mui/icons-material/WbTwilightRounded';

import PageBreadcrumbs from '@/components/common/PageBreadcrumbs';
import PhotoLightbox from '@/components/common/PhotoLightbox';
import ShareMenu from '@/components/common/ShareMenu';
import SceneImage from '@/components/common/SceneImage';
import { AttendeeStack } from '@/components/common/PersonAvatar';
import PersonLink from '@/components/common/PersonLink';
import NotFoundPage from './NotFoundPage';
import { getSpot } from '@/data/mockData';
import { formatLongDate, formatTimeRange, formatWeekdayDate } from '@/data/format';
import { useAppState } from '@/state/AppState';
import { RADIUS, cardSx, tintSx } from '@/theme';

/** Event detail: the full pitch on the left, the commitment on the right. */
export default function EventDetailPage() {
  const { eventId } = useParams();
  const { isJoined, isHosting, toggleJoin, findEvent } = useAppState();
  const [photoIndex, setPhotoIndex] = useState(null);
  const event = findEvent(eventId);

  if (!event) return <NotFoundPage />;

  const spot = getSpot(event.spotId);
  const hosting = isHosting(event.id);
  const joined = isJoined(event.id);

  return (
    <>
      <PageBreadcrumbs
        items={[
          { label: 'Discover', to: '/discover' },
          { label: 'Events', to: '/discover' },
          { label: event.title },
        ]}
      />

      <Box
        sx={{
          display: 'grid',
          gap: { xs: 2.5, lg: 3 },
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 400px)' },
          alignItems: 'start',
        }}
      >
        {/* ---- Main column ---- */}
        <Box>
          <Box sx={{ position: 'relative' }}>
            <SceneImage
              variant={event.scene}
              height={{ xs: 220, sm: 300, md: 360 }}
              radius={RADIUS.lg}
              title={`Artists painting at ${spot.name}`}
            />
            <Chip
              label={event.badge}
              size="small"
              sx={{
                position: 'absolute',
                top: 16,
                left: 16,
                bgcolor: 'primary.light',
                color: 'primary.dark',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                fontSize: '0.68rem',
                fontWeight: 800,
              }}
            />
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 2,
              mt: 2.5,
            }}
          >
            <Typography variant="h1" component="h1">
              {event.title}
            </Typography>
            <ShareMenu
              title={event.title}
              text={`${event.title} at ${spot.name}`}
              variant="outlined"
              size="small"
              sx={{ flexShrink: 0 }}
            />
          </Box>

          <Stack
            direction="row"
            spacing={1.25}
            sx={{ alignItems: 'center', mt: 1.5, flexWrap: 'wrap', rowGap: 0.75 }}
          >
            <Typography variant="body2" color="text.secondary">
              Hosted by
            </Typography>
            <PersonLink personId={event.hostId} size={28} nameVariant="body2" />
            <Typography variant="body2" color="text.secondary">
              · {event.skillNote}
            </Typography>
          </Stack>

          <Paper sx={{ ...cardSx, p: { xs: 2.5, md: 3.5 }, mt: 3 }}>
            <Typography variant="h3" component="h2">
              {event.headline}
            </Typography>
            {event.description.map((paragraph) => (
              <Typography key={paragraph.slice(0, 24)} color="text.secondary" sx={{ mt: 2 }}>
                {paragraph}
              </Typography>
            ))}

            <Divider sx={{ my: 3 }} />

            <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
              <BackpackOutlinedIcon sx={{ color: 'primary.main', mt: 0.25 }} />
              <Box>
                <Typography variant="h5">{event.kit.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                  {event.kit.body}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <Box
            sx={{
              mt: 4,
              mb: 2,
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Typography variant="h3" component="h2">
              A few moments from past paint-outs
            </Typography>
            <Link component="button" type="button" variant="body2" onClick={() => setPhotoIndex(0)}>
              View all photos
            </Link>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
            }}
          >
            {event.gallery.map((variant, i) => (
              <Box
                key={`${variant}-${i}`}
                component="button"
                type="button"
                onClick={() => setPhotoIndex(i)}
                aria-label={`Open photo ${i + 1} of ${event.gallery.length}`}
                sx={{ p: 0, border: 0, cursor: 'pointer', bgcolor: 'transparent', borderRadius: `${RADIUS.md}px` }}
              >
                <SceneImage variant={variant} height={140} radius={RADIUS.md} />
              </Box>
            ))}
          </Box>
        </Box>

        {/* ---- Sidebar ---- */}
        <Stack spacing={2.5} sx={{ position: { lg: 'sticky' }, top: { lg: 92 } }}>
          <Paper sx={{ ...cardSx, p: { xs: 2.5, md: 3 } }}>
            <Chip
              label={formatWeekdayDate(event.start)}
              size="small"
              sx={{
                bgcolor: 'primary.light',
                color: 'primary.dark',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                fontSize: '0.68rem',
                fontWeight: 800,
                mb: 2.5,
              }}
            />

            <Stack direction="row" spacing={1.75} sx={{ mb: 2.25 }}>
              <CalendarMonthRoundedIcon sx={{ color: 'primary.main' }} />
              <Box>
                <Typography variant="h4">{formatLongDate(event.start)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatTimeRange(event.start, event.end)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {event.timezone}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.75}>
              <PlaceRoundedIcon sx={{ color: 'primary.main' }} />
              <Box>
                <Link component={RouterLink} to={`/spots/${spot.id}`} variant="subtitle1">
                  {spot.name}
                </Link>
                <Typography variant="body2" color="text.secondary">
                  {event.meetingPoint}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {spot.city} · {spot.distanceKm} km away
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 2.5 }} />

            <AttendeeStack count={event.attendees} />

            <Button
              variant={joined ? 'outlined' : 'contained'}
              size="large"
              fullWidth
              startIcon={joined ? <CheckRoundedIcon /> : <AddRoundedIcon />}
              onClick={() => toggleJoin(event.id)}
              sx={{ mt: 2.5 }}
            >
              {hosting ? 'You’re hosting' : joined ? 'You’re going' : 'Join event'}
            </Button>

            <Button
              component={RouterLink}
              to={`/chats/${event.id}`}
              variant="outlined"
              size="large"
              fullWidth
              startIcon={<ForumOutlinedIcon />}
              sx={{ mt: 1.25 }}
            >
              Open chat room
            </Button>

            <Typography
              variant="caption"
              color="text.secondary"
              align="center"
              sx={{ display: 'block', mt: 2 }}
            >
              Free to join. Better with you there.
            </Typography>
          </Paper>

          <Paper sx={{ ...cardSx, p: 2.5 }}>
            <Typography variant="h5" sx={{ mb: 1.75 }}>
              Meet at this spot
            </Typography>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: `${RADIUS.md}px`, display: 'flex', gap: 1.75 }}>
              <SceneImage
                variant={spot.scene}
                sx={{ width: 96, height: 76, flexShrink: 0 }}
                radius={RADIUS.sm}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h5" sx={{ lineHeight: 1.3 }}>
                  {spot.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {spot.distanceKm} km · {spot.address}
                </Typography>
              </Box>
            </Paper>
            <Button
              component={RouterLink}
              to={`/spots/${spot.id}`}
              endIcon={<NorthEastRoundedIcon sx={{ fontSize: 15 }} />}
              sx={{ mt: 1.5, px: 0 }}
            >
              Explore the spot
            </Button>
          </Paper>

          <Paper sx={{ ...tintSx('green'), p: 2.5, display: 'flex', gap: 1.75 }}>
            <WbTwilightRoundedIcon sx={{ color: 'success.main', mt: 0.25 }} />
            <Box>
              <Typography variant="h5">{event.weatherNote.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                {event.weatherNote.body}
              </Typography>
            </Box>
          </Paper>
        </Stack>
      </Box>

      <PhotoLightbox
        open={photoIndex !== null}
        startIndex={photoIndex ?? 0}
        onClose={() => setPhotoIndex(null)}
        photos={event.gallery}
        title={event.title}
      />
    </>
  );
}
