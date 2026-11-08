import { Suspense, lazy, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';

import EventCard from '@/components/events/EventCard';
import SpotCard from '@/components/events/SpotCard';
import ArtistCard from '@/components/profile/ArtistCard';
import { ALL_PEOPLE, CURRENT_USER, SPOTS, getSpot } from '@/data/mockData';

/**
 * OpenLayers is a third of a megabyte. Loading it lazily means the rest of
 * Discover — search, filters, the whole spot grid — is on screen and usable
 * while the map is still arriving, and it never blocks first paint.
 */
const AlbertaMap = lazy(() => import('@/components/map/AlbertaMap'));
import { useAppState } from '@/state/AppState';
import { cardSx } from '@/theme';

/** Regions, not scene types — the map made geography the useful axis. */
const FILTERS = [
  'All of Alberta',
  'Calgary',
  'Rockies',
  'Foothills',
  'Badlands',
  'Central',
  'Edmonton',
  'Northern',
  'Prairie',
];

/** Cards shown before "Show all". The map always plots the full set. */
const GRID_PAGE = 12;

/**
 * Discover.
 *
 * Not in the supplied mockups, but every other screen's header links here,
 * so the app needs it to hold together. Built from the same components and
 * rhythm as the screens that were specified.
 */
export default function DiscoverPage() {
  const { user, isJoined, isHosting, allEvents } = useAppState();
  // Seeded from the header's search box, which navigates here with ?q=.
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [filter, setFilter] = useState('All of Alberta');
  // Shared between the map and the grid so hovering either highlights both.
  const [activeSpotId, setActiveSpotId] = useState(null);
  const [selectedSpotId, setSelectedSpotId] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const spots = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SPOTS.filter((spot) => {
      const byRegion = filter === 'All of Alberta' || spot.region === filter;
      const byQuery =
        !q ||
        spot.name.toLowerCase().includes(q) ||
        spot.tagline.toLowerCase().includes(q) ||
        spot.city.toLowerCase().includes(q) ||
        spot.address.toLowerCase().includes(q);
      return byRegion && byQuery;
    });
  }, [query, filter]);

  // The grid is paginated but the map never is — a hidden card would mean
  // a pin you cannot click through to.
  const visibleSpots = showAll ? spots : spots.slice(0, GRID_PAGE);

  // Drop the preview if the spot behind it is filtered away, so the card
  // can never describe a pin that is no longer on the map.
  const selectedSpot = useMemo(
    () => (selectedSpotId && spots.some((s) => s.id === selectedSpotId) ? getSpot(selectedSpotId) : null),
    [selectedSpotId, spots],
  );

  // The artist directory. Private profiles are listed too — the person is
  // not hidden, only their gallery is.
  const artists = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_PEOPLE.filter(
      (p) =>
        p.id !== CURRENT_USER.id &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.handle.toLowerCase().includes(q) ||
          (p.mediums ?? []).some((m) => m.toLowerCase().includes(q))),
    );
  }, [query]);

  const events = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allEvents.filter((e) => !q || e.title.toLowerCase().includes(q)).slice(0, 3);
  }, [allEvents, query]);

  return (
    <>
      <Box sx={{ maxWidth: 640 }}>
        <Typography variant="overline" sx={{ color: 'primary.main' }}>
          Discover
        </Typography>
        <Typography variant="h1" component="h1" sx={{ mt: 0.25 }}>
          Find your next view, {user.firstName}.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Painting spots across Alberta, and the people already out there making work.
        </Typography>
      </Box>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ mt: 3, alignItems: { sm: 'center' } }}
      >
        <TextField
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            // Keep the URL shareable without stacking history entries.
            setSearchParams(e.target.value ? { q: e.target.value } : {}, { replace: true });
          }}
          placeholder="Search spots by name or feel"
          sx={{ maxWidth: { sm: 340 }, width: '100%' }}
          slotProps={{
            htmlInput: { 'aria-label': 'Search painting spots' },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
        />
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
          {FILTERS.map((f) => (
            <Chip
              key={f}
              label={f}
              onClick={() => {
                setFilter(f);
                setShowAll(false);
              }}
              variant={filter === f ? 'filled' : 'outlined'}
              color={filter === f ? 'primary' : 'default'}
              sx={{ fontWeight: 600 }}
            />
          ))}
        </Stack>
      </Stack>

      <Box sx={{ mt: 3 }}>
        <Suspense
          fallback={
            <Paper
              sx={{
                ...cardSx,
                height: { xs: 320, sm: 420, md: 520 },
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Stack sx={{ alignItems: 'center', gap: 1.5 }}>
                <CircularProgress size={22} />
                <Typography variant="body2" color="text.secondary">
                  Loading the map of Alberta…
                </Typography>
              </Stack>
            </Paper>
          }
        >
          <AlbertaMap
            spots={spots}
            activeSpotId={activeSpotId}
            onHoverSpot={setActiveSpotId}
            onSelectSpot={setSelectedSpotId}
            selectedSpot={selectedSpot}
          />
        </Suspense>
      </Box>

      <Typography variant="h3" component="h2" sx={{ mt: 4.5, mb: 2 }}>
        {filter === 'All of Alberta' ? 'Painting spots across Alberta' : `Painting spots — ${filter}`}
      </Typography>

      {spots.length ? (
        <Box
          sx={{
            display: 'grid',
            gap: 2.5,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(3, minmax(0, 1fr))',
            },
          }}
        >
          {visibleSpots.map((spot) => (
            <Box
              key={spot.id}
              onMouseEnter={() => setActiveSpotId(spot.id)}
              onMouseLeave={() => setActiveSpotId(null)}
              // Keyboard users get the same link between grid and map.
              onFocusCapture={() => setActiveSpotId(spot.id)}
              onBlurCapture={() => setActiveSpotId(null)}
              sx={{ height: '100%' }}
            >
              <SpotCard spot={spot} active={spot.id === activeSpotId} />
            </Box>
          ))}
        </Box>
      ) : (
        <Paper sx={{ ...cardSx, p: 5, textAlign: 'center' }}>
          <Typography variant="h4">No spots match that</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 2.5 }}>
            Try a different word, or clear the filter.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              setQuery('');
              setFilter('All of Alberta');
            }}
          >
            Reset search
          </Button>
        </Paper>
      )}

      {spots.length > GRID_PAGE ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button variant="outlined" onClick={() => setShowAll((v) => !v)}>
            {showAll
              ? `Show fewer spots`
              : `Show all ${spots.length} spots`}
          </Button>
        </Box>
      ) : null}

      {artists.length ? (
        <>
          <Typography variant="h3" component="h2" sx={{ mt: 5, mb: 0.75 }} id="artists">
            Artists near you
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Some keep their gallery private. You can still find them at paint-outs.
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gap: 2.5,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(4, minmax(0, 1fr))',
              },
            }}
          >
            {artists.map((person) => (
              <ArtistCard key={person.id} person={person} />
            ))}
          </Box>
        </>
      ) : null}

      <Box
        sx={{
          mt: 5,
          mb: 2,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Typography variant="h3" component="h2">
          Upcoming paint-outs
        </Typography>
        <Button component={RouterLink} to="/my-events" size="small">
          My events
        </Button>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(3, minmax(0, 1fr))',
          },
        }}
      >
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            status={isHosting(event.id) ? 'Hosting' : isJoined(event.id) ? 'Joined' : undefined}
          />
        ))}
      </Box>
    </>
  );
}
