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
import RouteCard from '@/components/events/RouteCard';
import SpotCard from '@/components/events/SpotCard';
import ArtistCard from '@/components/profile/ArtistCard';
import { stopsFor } from '@/lib/routes';

/**
 * OpenLayers is a third of a megabyte. Loading it lazily means the rest of
 * Discover — search, filters, the whole spot grid — is on screen and usable
 * while the map is still arriving, and it never blocks first paint.
 */
const AlbertaMap = lazy(() => import('@/components/map/AlbertaMap'));
import { matchesAny } from '@/lib/fuzzy';
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
  const { user, isJoined, isHosting, allEvents, spots: allSpots, people, routes: allRoutes } = useAppState();
  // Seeded from the header's search box, which navigates here with ?q=.
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [filter, setFilter] = useState('All of Alberta');
  // Shared between the map and the grid so hovering either highlights both.
  const [activeSpotId, setActiveSpotId] = useState(null);
  const [selectedSpotId, setSelectedSpotId] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const spots = useMemo(() => {
    return allSpots.filter((spot) => {
      const byRegion = filter === 'All of Alberta' || spot.region === filter;
      const byQuery = matchesAny(query, [spot.name, spot.tagline, spot.city, spot.address]);
      return byRegion && byQuery;
    });
  }, [query, filter, allSpots]);

  // The grid is paginated but the map never is — a hidden card would mean
  // a pin you cannot click through to.
  const visibleSpots = showAll ? spots : spots.slice(0, GRID_PAGE);

  // Drop the preview if the spot behind it is filtered away, so the card
  // can never describe a pin that is no longer on the map.
  const selectedSpot = useMemo(
    () => (selectedSpotId ? spots.find((spot) => spot.id === selectedSpotId) ?? null : null),
    [selectedSpotId, spots],
  );

  // The artist directory. Private profiles are listed too — the person is
  // not hidden, only their gallery is.
  const artists = useMemo(() => {
    return people.filter(
      (p) =>
        p.id !== user?.id &&
        matchesAny(query, [p.name, p.handle, ...(p.mediums ?? [])]),
    );
  }, [query, people, user]);

  const events = useMemo(() => {
    return allEvents.filter((e) => matchesAny(query, [e.title])).slice(0, 3);
  }, [allEvents, query]);

  const routes = useMemo(() => {
    return allRoutes.filter((route) => {
      const routeSpots = stopsFor(route)
        .map((stop) => allSpots.find((spot) => spot.id === stop.spotId))
        .filter(Boolean);
      const byRegion =
        filter === 'All of Alberta' || routeSpots.some((spot) => spot.region === filter);
      const byQuery = matchesAny(query, [
        route.name,
        route.description,
        ...routeSpots.flatMap((spot) => [spot.name, spot.city]),
      ]);
      return byRegion && byQuery;
    });
  }, [allRoutes, allSpots, query, filter]);

  return (
    <>
      <Box sx={{ maxWidth: 640 }}>
        <Typography variant="overline" sx={{ color: 'primary.main' }}>
          Discover
        </Typography>
        <Typography variant="h1" component="h1" sx={{ mt: 0.25 }}>
          Find your next view, {user?.firstName || 'there'}.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Painting spots, shared routes, and the people already out there making work.
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
          placeholder="Search spots, routes, or people"
          sx={{ maxWidth: { sm: 340 }, width: '100%' }}
          slotProps={{
            htmlInput: { 'aria-label': 'Search spots, routes, or people' },
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
          {filter === 'All of Alberta' ? 'Painting routes' : `Routes through ${filter}`}
        </Typography>
        <Button component={RouterLink} to="/routes" size="small">
          Plan a route
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: -1 }}>
        Join a walk and it shows up on your profile, where anyone can see you’re going.
      </Typography>

      {routes.length ? (
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
          {routes.map((route) => (
            <RouteCard key={route.id} route={route} />
          ))}
        </Box>
      ) : (
        <Paper sx={{ ...cardSx, p: 5, textAlign: 'center' }}>
          <Typography variant="h4">
            {allRoutes.length ? 'No routes match that' : 'No routes yet'}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 2.5 }}>
            {allRoutes.length
              ? 'Try a different word, or clear the filter.'
              : 'Plan a walk between painting spots and other artists can join you.'}
          </Typography>
          <Button component={RouterLink} to="/routes" variant="contained">
            Plan a route
          </Button>
        </Paper>
      )}

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
