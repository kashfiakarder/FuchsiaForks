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
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import BookmarkBorderRoundedIcon from '@mui/icons-material/BookmarkBorderRounded';
import BookmarkRoundedIcon from '@mui/icons-material/BookmarkRounded';
import DirectionsWalkRoundedIcon from '@mui/icons-material/DirectionsWalkRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LocalParkingRoundedIcon from '@mui/icons-material/LocalParkingRounded';
import NorthEastRoundedIcon from '@mui/icons-material/NorthEastRounded';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';

import PageBreadcrumbs from '@/components/common/PageBreadcrumbs';
import SceneImage from '@/components/common/SceneImage';
import Stars from '@/components/common/Stars';
import { AttendeeStack } from '@/components/common/PersonAvatar';
import PersonLink from '@/components/common/PersonLink';
import ReviewDialog from '@/components/reviews/ReviewDialog';
import ShareMenu from '@/components/common/ShareMenu';
import NotFoundPage from './NotFoundPage';
import { formatDayNumber, formatMonthAbbr, formatReviewDate, formatShortDate, formatTimeRange } from '@/data/format';
import { useAppState } from '@/state/AppState';
import { RADIUS, cardSx } from '@/theme';

const FEATURE_ICONS = [DirectionsWalkRoundedIcon, WbSunnyOutlinedIcon, LocalParkingRoundedIcon];

export default function SpotDetailPage() {
  const { spotId } = useParams();
  const { reviewsBySpot, isSaved, toggleSaveSpot, getSpot, eventsAtSpot, user, getProfile } = useAppState();
  const spot = getSpot(spotId);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!spot) return <NotFoundPage />;

  const events = eventsAtSpot(spot.id);
  const reviews = reviewsBySpot[spot.id] ?? [];
  const saved = isSaved(spot.id);

  // The seeded reviews are a sample of a longer history, not the whole of
  // it, so the headline figure blends the spot's standing score with
  // anything added in this session rather than averaging the three visible
  // samples — which would read as a flat 5.0 and misrepresent the place.
  const mine = reviews.filter((r) => r.mine);
  const reviewCount = spot.reviewCount + mine.length;
  const average =
    (spot.rating * spot.reviewCount + mine.reduce((sum, r) => sum + r.rating, 0)) / reviewCount;

  return (
    <>
      <PageBreadcrumbs
        items={[
          { label: 'Discover', to: '/discover' },
          { label: 'Calgary', to: '/discover' },
          { label: spot.name },
        ]}
      />

      <Box sx={{ position: 'relative' }}>
        <SceneImage
          variant={spot.scene}
          height={{ xs: 200, sm: 280, md: 330 }}
          radius={RADIUS.lg}
          title={`The view at ${spot.name}`}
        />
        <Chip
          label={spot.tagline}
          size="small"
          sx={{ position: 'absolute', bottom: 16, left: 16, bgcolor: 'rgba(255,255,255,0.94)' }}
        />
        <Stack direction="row" spacing={1.25} sx={{ position: 'absolute', top: 16, right: 16 }}>
          <Button
            variant="outlined"
            startIcon={saved ? <BookmarkRoundedIcon /> : <BookmarkBorderRoundedIcon />}
            onClick={() => toggleSaveSpot(spot.id)}
            aria-pressed={saved}
          >
            {saved ? 'Saved' : 'Save spot'}
          </Button>
          <ShareMenu title={spot.name} text={`${spot.name} — ${spot.tagline}`} variant="outlined" />
        </Stack>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 2,
          mt: 3,
        }}
      >
        <Box>
          <Typography variant="h1" component="h1">
            {spot.name}
          </Typography>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mt: 1 }}>
            <PlaceOutlinedIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {spot.address}, {spot.city} · {spot.distanceKm} km away
            </Typography>
          </Stack>
        </Box>

        <Box sx={{ textAlign: { sm: 'right' } }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: { sm: 'flex-end' } }}>
            <Stars value={average} size={20} label={`Rated ${average.toFixed(1)} out of 5`} />
            <Typography sx={{ fontWeight: 800 }}>{average.toFixed(1)}</Typography>
            <Typography variant="body2" color="text.secondary">
              ({reviewCount} reviews)
            </Typography>
          </Stack>
          <Box sx={{ mt: 1.25, display: 'flex', justifyContent: { sm: 'flex-end' } }}>
            <AttendeeStack count={spot.artistCount} label="artists painting here" size={28} />
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: { xs: 2.5, lg: 3 },
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 420px)' },
          alignItems: 'start',
          mt: 3,
        }}
      >
        {/* ---- Left ---- */}
        <Stack spacing={2.5}>
          <Paper sx={{ ...cardSx, p: { xs: 2.5, md: 3 } }}>
            <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between", mb: 1, width: '100%' }}>
              <Typography variant="h3" component="h2">
                Upcoming Events
              </Typography>
              <Link component={RouterLink} to="/discover" variant="body2">
                View all events
              </Link>
            </Stack>

            {events.length ? (
              events.map((event, i) => (
                <Box key={event.id}>
                  {i > 0 ? <Divider sx={{ my: 0.5 }} /> : null}
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center", py: 1.75 }}>
                    <Box
                      aria-hidden="true"
                      sx={{
                        bgcolor: 'primary.light',
                        borderRadius: `${RADIUS.sm}px`,
                        px: 1.25,
                        py: 0.85,
                        textAlign: 'center',
                        minWidth: 52,
                      }}
                    >
                      <Typography variant="overline" sx={{ display: 'block', fontSize: '0.58rem', lineHeight: 1.2, color: 'primary.dark' }}>
                        {formatMonthAbbr(event.start)}
                      </Typography>
                      <Typography sx={{ fontWeight: 800, lineHeight: 1, color: 'primary.dark' }}>
                        {formatDayNumber(event.start)}
                      </Typography>
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h5">
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
                      <Stack direction="row" spacing={0.6} sx={{ alignItems: "center", mt: 0.4 }}>
                        <AccessTimeRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {formatShortDate(event.start)} · {formatTimeRange(event.start, event.end)}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3 }}>
                        {event.attendees} artists going · Hosted by{' '}
                        {event.hostId === user?.id ? 'you' : getProfile(event.hostId)?.name}
                      </Typography>
                    </Box>

                    <Link
                      component={RouterLink}
                      to={`/events/${event.id}`}
                      aria-label={`Open ${event.title}`}
                      sx={{ display: 'inline-flex', color: 'primary.main' }}
                    >
                      <NorthEastRoundedIcon fontSize="small" />
                    </Link>
                  </Stack>
                </Box>
              ))
            ) : (
              <Typography color="text.secondary" sx={{ py: 2 }}>
                No paint-outs scheduled here yet. Be the first to plan one.
              </Typography>
            )}
          </Paper>

          <Paper sx={{ ...cardSx, p: { xs: 2.5, md: 3 } }}>
            <Typography variant="h3" component="h2" sx={{ mb: 1.5 }}>
              A little about this view
            </Typography>
            <Typography color="text.secondary">{spot.about}</Typography>

            <Stack
              direction="row"
              spacing={3}
              sx={{ mt: 2.5, flexWrap: 'wrap', gap: 2 }}
            >
              {spot.features.map((feature, i) => {
                const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
                return (
                  <Stack key={feature} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Icon sx={{ fontSize: 19, color: 'success.main' }} />
                    <Typography variant="body2" color="text.secondary">
                      {feature}
                    </Typography>
                  </Stack>
                );
              })}
            </Stack>
          </Paper>
        </Stack>

        {/* ---- Reviews ---- */}
        <Paper sx={{ ...cardSx, p: { xs: 2.5, md: 3 } }}>
          <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between", mb: 1, width: '100%' }}>
            <Typography variant="h3" component="h2">
              Reviews
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {reviewCount} reviews
            </Typography>
          </Stack>

          {reviews.length ? (
            reviews.slice(0, 4).map((review, i) => {
              return (
                <Box key={review.id}>
                  {i > 0 ? <Divider sx={{ my: 2 }} /> : null}
                  <Box sx={{ pt: i === 0 ? 1.5 : 0 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                        <PersonLink
                          personId={review.authorId}
                          size={34}
                          nameVariant="h6"
                          secondary={formatReviewDate(review.date)}
                        />
                        <Stars value={review.rating} size={16} />
                      </Stack>
                      {review.body ? (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 1, pl: { sm: '46px' } }}
                        >
                          {review.body}
                        </Typography>
                      ) : null}
                    </Box>
                  </Box>
                </Box>
              );
            })
          ) : (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              No reviews yet. Yours would be the first.
            </Typography>
          )}

          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<EditOutlinedIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ mt: 3 }}
          >
            Write a review
          </Button>
        </Paper>
      </Box>

      <ReviewDialog open={dialogOpen} onClose={() => setDialogOpen(false)} spot={spot} />
    </>
  );
}
