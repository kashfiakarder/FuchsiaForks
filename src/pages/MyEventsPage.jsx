import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AltRouteRoundedIcon from '@mui/icons-material/AltRouteRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import NorthEastRoundedIcon from '@mui/icons-material/NorthEastRounded';
import SwapVertRoundedIcon from '@mui/icons-material/SwapVertRounded';

import EventCard from '@/components/events/EventCard';
import CreateEventDialog from '@/components/events/CreateEventDialog';
import SceneImage from '@/components/common/SceneImage';
import { formatShortDate, formatTimeRange } from '@/data/format';
import { useAppState } from '@/state/AppState';
import { BRAND, RADIUS, cardSx, tintSx } from '@/theme';

/**
 * My Events.
 *
 * Upcoming is driven by live state — joining an event anywhere in the app
 * adds it here immediately, and leaving removes it. Past is history and
 * read-only.
 */
export default function MyEventsPage() {
  const { user, joinedEventIds, isHosting, allEvents, pastEvents, getSpot, getProfile } = useAppState();
  const [tab, setTab] = useState('upcoming');
  const [createOpen, setCreateOpen] = useState(false);
  const [soonestFirst, setSoonestFirst] = useState(true);

  const upcoming = useMemo(() => {
    const list = allEvents.filter((e) => joinedEventIds.includes(e.id) || e.hostId === user?.id);
    return list.sort((a, b) =>
      soonestFirst ? a.start.localeCompare(b.start) : b.start.localeCompare(a.start),
    );
  }, [allEvents, joinedEventIds, soonestFirst, user]);

  const past = useMemo(
    () =>
      pastEvents
        .filter((event) => joinedEventIds.includes(event.id) || event.hostId === user?.id)
        .sort((a, b) => b.start.localeCompare(a.start)),
    [pastEvents, joinedEventIds, user],
  );

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="overline" sx={{ color: 'primary.main' }}>
            Your creative calendar
          </Typography>
          <Typography variant="h1" component="h1" sx={{ mt: 0.25 }}>
            My Events
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.75 }}>
            A few good reasons to get outside, {user.firstName}.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.25} sx={{ flexWrap: 'wrap' }}>
          <Button
            component={RouterLink}
            to="/routes"
            variant="outlined"
            size="large"
            startIcon={<AltRouteRoundedIcon />}
          >
            Routes
          </Button>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddRoundedIcon />}
            onClick={() => setCreateOpen(true)}
          >
            Create an event
          </Button>
        </Stack>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          mt: 3,
          borderBottom: `1px solid ${BRAND.line}`,
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          aria-label="Event history"
          sx={{ minHeight: 44, '& .MuiTabs-indicator': { height: 2 } }}
        >
          <Tab
            value="upcoming"
            label={
              <Box component="span" sx={{ display: 'inline-flex', gap: 0.85, alignItems: 'baseline' }}>
                Upcoming
                <Box component="span" sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                  {upcoming.length}
                </Box>
              </Box>
            }
          />
          <Tab
            value="past"
            label={
              <Box component="span" sx={{ display: 'inline-flex', gap: 0.85, alignItems: 'baseline' }}>
                Past
                <Box component="span" sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                  {past.length}
                </Box>
              </Box>
            }
          />
        </Tabs>

        {tab === 'upcoming' ? (
          <Button
            size="small"
            onClick={() => setSoonestFirst((v) => !v)}
            startIcon={<SwapVertRoundedIcon />}
            sx={{ color: 'text.secondary', mb: 0.5 }}
          >
            {soonestFirst ? 'Soonest first' : 'Latest first'}
          </Button>
        ) : null}
      </Box>

      {tab === 'upcoming' ? (
        upcoming.length ? (
          <Box
            sx={{
              mt: 3,
              display: 'grid',
              gap: 2.5,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(3, minmax(0, 1fr))',
              },
            }}
          >
            {upcoming.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                status={isHosting(event.id) ? 'Hosting' : 'Joined'}
              />
            ))}
          </Box>
        ) : (
          <Paper sx={{ ...cardSx, mt: 3, p: 5, textAlign: 'center' }}>
            <Typography variant="h3">Nothing in the calendar yet</Typography>
            <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
              Join a paint-out and it will show up here.
            </Typography>
            <Button component={RouterLink} to="/discover" variant="contained">
              Browse paint-outs
            </Button>
          </Paper>
        )
      ) : (
        past.length ? (
        <Paper sx={{ ...cardSx, mt: 3, overflow: 'hidden' }}>
          {past.map((event, i) => {
            const spot = getSpot(event.spotId);
            const host = getProfile(event.hostId);
            return (
              <Box key={event.id}>
                {i > 0 ? <Divider /> : null}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                  <SceneImage
                    variant={event.scene}
                    sx={{ width: 76, height: 56, flexShrink: 0 }}
                    radius={RADIUS.sm}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h5" noWrap>
                      {event.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {spot?.name} · {formatShortDate(event.start)} ·{' '}
                      {formatTimeRange(event.start, event.end)}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: { xs: 'none', sm: 'block' }, whiteSpace: 'nowrap' }}
                  >
                    {event.attendees} artists · {host?.id === user?.id ? 'You hosted' : host?.name}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Paper>
        ) : (
          <Paper sx={{ ...cardSx, mt: 3, p: 5, textAlign: 'center' }}>
            <Typography variant="h3">No past paint-outs yet</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Events you have already been to will settle here.
            </Typography>
          </Paper>
        )
      )}

      <Paper
        sx={{
          ...tintSx('magenta'),
          mt: 3.5,
          p: { xs: 2.5, md: 3 },
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Stack
          direction="row"
          spacing={2}
         
          sx={{ alignItems: "center", flex: 1, minWidth: 260 }}
        >
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: `${RADIUS.md}px`,
              bgcolor: 'background.paper',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <AutoAwesomeRoundedIcon sx={{ color: 'primary.main' }} />
          </Box>
          <Box>
            <Typography variant="h4">Your next favourite view is out there.</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
              Explore Calgary’s painting spots and find a few more people to share them with.
            </Typography>
          </Box>
        </Stack>

        <Button
          component={RouterLink}
          to="/discover"
          variant="outlined"
          startIcon={<NorthEastRoundedIcon />}
        >
          Discover spots
        </Button>
      </Paper>

      <CreateEventDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
