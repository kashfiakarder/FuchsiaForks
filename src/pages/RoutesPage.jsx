import { Suspense, lazy, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

import PageBreadcrumbs from '@/components/common/PageBreadcrumbs';
import PersonLink from '@/components/common/PersonLink';
import { useAppState } from '@/state/AppState';
import { BRAND, RADIUS, cardSx } from '@/theme';

const RouteMap = lazy(() => import('@/components/map/RouteMap'));

function stopsFor(route) {
  return [...(route?.stops ?? [])].sort((a, b) => a.order - b.order);
}

/**
 * Compose an ordered walk of painting spots, then invite people to come along.
 * A saved route and a draft in progress share the same drawing.
 */
export default function RoutesPage() {
  const { user, people, routes, spots, getSpot, createRoute, inviteToRoute, respondToRoute } = useAppState();
  const [mode, setMode] = useState(() => (routes.length ? 'view' : 'build'));
  const [selectedId, setSelectedId] = useState(() => routes[0]?.id ?? null);
  const [name, setName] = useState('');
  const [spotToAdd, setSpotToAdd] = useState('');
  const [draftIds, setDraftIds] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [inviteId, setInviteId] = useState('');
  const [inviting, setInviting] = useState(false);
  const [responding, setResponding] = useState(false);

  const selected = routes.find((route) => route.id === selectedId) ?? routes[0] ?? null;

  const drawnStops = useMemo(() => {
    const ids =
      mode === 'build' ? draftIds : stopsFor(selected).map((stop) => stop.spotId);
    return ids.map((id) => getSpot(id)).filter(Boolean);
  }, [mode, draftIds, selected, getSpot]);

  const availableSpots = spots.filter((spot) => !draftIds.includes(spot.id));

  const startBuild = () => {
    setMode('build');
    setName('');
    setDraftIds([]);
    setSpotToAdd('');
    setError('');
  };

  const showRoute = (routeId) => {
    setSelectedId(routeId);
    setMode('view');
    setError('');
  };

  const addStop = () => {
    if (!spotToAdd || draftIds.includes(spotToAdd)) return;
    setDraftIds((ids) => [...ids, spotToAdd]);
    setSpotToAdd('');
    setError('');
  };

  const moveStop = (index, delta) => {
    setDraftIds((ids) => {
      const target = index + delta;
      if (target < 0 || target >= ids.length) return ids;
      const next = ids.slice();
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  };

  const save = async () => {
    const found = !name.trim()
      ? 'Give the route a name.'
      : draftIds.length < 2
        ? 'Add at least two spots.'
        : '';
    if (found) {
      setError(found);
      return;
    }
    setSaving(true);
    const created = await createRoute({ name: name.trim(), spotIds: draftIds });
    setSaving(false);
    if (!created) return;
    setSelectedId(created.id);
    setMode('view');
    setName('');
    setDraftIds([]);
    setError('');
  };

  const isHost = Boolean(selected && user && selected.hostId === user.id);
  const myInvite = (selected?.invites || []).find((invite) => invite.userId === user?.id) ?? null;
  const takenIds = new Set(
    (selected?.invites || [])
      .filter((invite) => invite.status === 'pending' || invite.status === 'accepted')
      .map((invite) => invite.userId),
  );
  if (selected?.hostId) takenIds.add(selected.hostId);
  const inviteChoices = people.filter((person) => !takenIds.has(person.id));

  const sendInvite = async () => {
    if (!selected || !inviteId) return;
    setInviting(true);
    const updated = await inviteToRoute(selected.id, inviteId);
    setInviting(false);
    if (updated) setInviteId('');
  };

  const answer = async (status) => {
    if (!selected) return;
    setResponding(true);
    await respondToRoute(selected.id, status);
    setResponding(false);
  };

  const mapLabel = mode === 'build' ? name.trim() || 'New route' : selected?.name;

  return (
    <>
      <PageBreadcrumbs
        items={[
          { label: 'My Events', to: '/my-events' },
          { label: 'Routes' },
        ]}
      />

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ maxWidth: 640 }}>
          <Typography variant="overline" sx={{ color: 'primary.main' }}>
          Painting routes
        </Typography>
        <Typography variant="h1" component="h1" sx={{ mt: 0.25 }}>
          A path you can share
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Put stops in order, then invite people to join you on the walk.
        </Typography>
        </Box>
        {mode === 'view' ? (
          <Button variant="contained" size="large" startIcon={<AddRoundedIcon />} onClick={startBuild}>
            Plan a route
          </Button>
        ) : routes.length ? (
          <Button variant="outlined" size="large" onClick={() => showRoute(selected?.id)}>
            Cancel
          </Button>
        ) : null}
      </Box>

      <Box
        sx={{
          mt: 3,
          display: 'grid',
          gap: 2.5,
          alignItems: 'start',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(300px, 400px) minmax(0, 1fr)' },
        }}
      >
        <Stack spacing={2.5}>
          <Paper sx={{ ...cardSx, overflow: 'hidden' }}>
            <Box sx={{ px: 2.25, py: 1.75, borderBottom: `1px solid ${BRAND.line}` }}>
              <Typography variant="h5">Saved routes</Typography>
              <Typography variant="caption" color="text.secondary">
                {routes.length ? 'Select one to see it on the map' : 'None yet — plan the first one'}
              </Typography>
            </Box>
            {routes.length ? (
              routes.map((route) => {
                const active = mode === 'view' && selected?.id === route.id;
                const count = stopsFor(route).length;
                const coming =
                  (route.invites || []).filter((invite) => invite.status === 'accepted').length +
                  (route.hostId ? 1 : 0);
                const mine = (route.invites || []).find((invite) => invite.userId === user?.id);
                return (
                  <Box
                    key={route.id}
                    component="button"
                    type="button"
                    onClick={() => showRoute(route.id)}
                    aria-pressed={active}
                    sx={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      font: 'inherit',
                      cursor: 'pointer',
                      border: 0,
                      borderBottom: `1px solid ${BRAND.line}`,
                      px: 2.25,
                      py: 1.5,
                      bgcolor: active ? BRAND.magentaSoft : 'transparent',
                    }}
                  >
                    <Typography variant="subtitle2">{route.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {count} {count === 1 ? 'stop' : 'stops'}
                      {' · '}
                      {coming} {coming === 1 ? 'person' : 'people'}
                      {mine?.status === 'pending' ? ' · Invited' : ''}
                      {mine?.status === 'accepted' ? ' · You’re going' : ''}
                    </Typography>
                  </Box>
                );
              })
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2.25 }}>
                Saved routes will collect here.
              </Typography>
            )}
          </Paper>

          {mode === 'build' ? (
            <Paper sx={{ ...cardSx, p: 2.25 }}>
              <Typography variant="h5">New route</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                Add each stop in the order you will visit it.
              </Typography>
              <Stack spacing={1.75}>
                <TextField
                  label="Route name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setError('');
                  }}
                  placeholder="Calgary river loop"
                  fullWidth
                  autoFocus
                />
                <Stack direction="row" spacing={1}>
                  <TextField
                    select
                    label="Add a spot"
                    value={spotToAdd}
                    onChange={(event) => setSpotToAdd(event.target.value)}
                    fullWidth
                    disabled={!availableSpots.length}
                  >
                    {availableSpots.map((spot) => (
                      <MenuItem key={spot.id} value={spot.id}>
                        {spot.name} — {spot.region}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Button
                    variant="outlined"
                    onClick={addStop}
                    disabled={!spotToAdd}
                    aria-label="Add stop"
                    sx={{ flexShrink: 0, minWidth: 48, px: 1.25 }}
                  >
                    <AddRoundedIcon />
                  </Button>
                </Stack>

                {draftIds.length ? (
                  <Box>
                    {draftIds.map((spotId, index) => {
                      const spot = getSpot(spotId);
                      if (!spot) return null;
                      return (
                        <Stack
                          key={`${spotId}-${index}`}
                          direction="row"
                          spacing={1}
                          sx={{
                            alignItems: 'center',
                            py: 1,
                            borderTop: index === 0 ? 0 : `1px solid ${BRAND.line}`,
                          }}
                        >
                          <Box
                            sx={{
                              width: 26,
                              height: 26,
                              borderRadius: `${RADIUS.pill}px`,
                              bgcolor: 'primary.main',
                              color: 'primary.contrastText',
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                            aria-hidden
                          >
                            {index + 1}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" noWrap>
                              {spot.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {spot.city}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            aria-label={`Move ${spot.name} earlier`}
                            onClick={() => moveStop(index, -1)}
                            disabled={index === 0}
                          >
                            <ArrowUpwardRoundedIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            aria-label={`Move ${spot.name} later`}
                            onClick={() => moveStop(index, 1)}
                            disabled={index === draftIds.length - 1}
                          >
                            <ArrowDownwardRoundedIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            aria-label={`Remove ${spot.name}`}
                            onClick={() => setDraftIds((ids) => ids.filter((id) => id !== spotId))}
                          >
                            <CloseRoundedIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      );
                    })}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No stops yet. The map fills in as you add them.
                  </Typography>
                )}

                {error ? (
                  <Typography variant="body2" color="error">
                    {error}
                  </Typography>
                ) : null}

                <Button variant="contained" onClick={save} disabled={saving}>
                  {saving ? 'Saving…' : 'Save route'}
                </Button>
              </Stack>
            </Paper>
          ) : selected ? (
            <Paper sx={{ ...cardSx, p: 2.25 }}>
              <Typography variant="h5">{selected.name}</Typography>
              {selected.description ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                  {selected.description}
                </Typography>
              ) : null}
              {myInvite?.status === 'pending' ? (
                <Stack spacing={1.25} sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    You’re invited to walk this route.
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" onClick={() => answer('accepted')} disabled={responding}>
                      Join
                    </Button>
                    <Button variant="outlined" onClick={() => answer('declined')} disabled={responding}>
                      Not this time
                    </Button>
                  </Stack>
                </Stack>
              ) : null}

              <Typography variant="h5" sx={{ mt: 2.5 }}>
                Who’s coming
              </Typography>
              <Stack spacing={1.25} sx={{ mt: 1.25 }}>
                {selected.hostId ? (
                  <PersonLink personId={selected.hostId} secondary="Planning the route" />
                ) : null}
                {(selected.invites || [])
                  .filter((invite) => invite.status !== 'declined')
                  .filter((invite) => invite.status === 'accepted' || isHost || invite.userId === user?.id)
                  .map((invite) => (
                    <Stack
                      key={invite.userId}
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <PersonLink
                        personId={invite.userId}
                        secondary={invite.status === 'accepted' ? 'Joined' : 'Invited'}
                      />
                      {invite.userId === user?.id && invite.status === 'accepted' ? (
                        <Button size="small" onClick={() => answer('declined')} disabled={responding}>
                          Leave
                        </Button>
                      ) : null}
                    </Stack>
                  ))}
              </Stack>

              {isHost ? (
                <Stack spacing={1.25} sx={{ mt: 2.25 }}>
                  <Typography variant="body2" color="text.secondary">
                    Invite someone to join you.
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      select
                      label="Person"
                      value={inviteId}
                      onChange={(event) => setInviteId(event.target.value)}
                      fullWidth
                      disabled={!inviteChoices.length}
                    >
                      <MenuItem value="" disabled>
                        Choose someone
                      </MenuItem>
                      {inviteChoices.map((person) => (
                        <MenuItem key={person.id} value={person.id}>
                          {person.name}
                        </MenuItem>
                      ))}
                    </TextField>
                    <Button
                      variant="contained"
                      onClick={sendInvite}
                      disabled={!inviteId || inviting}
                      sx={{ flexShrink: 0 }}
                    >
                      {inviting ? 'Inviting…' : 'Invite'}
                    </Button>
                  </Stack>
                </Stack>
              ) : null}

              <Typography variant="h5" sx={{ mt: 2.5 }}>
                Stops
              </Typography>
              <Stack sx={{ mt: 0.5 }}>
                {drawnStops.map((spot, index) => (
                  <Stack
                    key={spot.id}
                    direction="row"
                    spacing={1.25}
                    component={RouterLink}
                    to={`/spots/${spot.id}`}
                    sx={{
                      alignItems: 'center',
                      py: 1.1,
                      textDecoration: 'none',
                      color: 'inherit',
                      borderTop: index === 0 ? 0 : `1px solid ${BRAND.line}`,
                    }}
                  >
                    <Box
                      sx={{
                        width: 26,
                        height: 26,
                        borderRadius: `${RADIUS.pill}px`,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" noWrap>
                        {spot.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {spot.city}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          ) : null}
        </Stack>

        <Suspense
          fallback={
            <Paper
              sx={{
                ...cardSx,
                height: { xs: 360, sm: 480, lg: 640 },
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Stack sx={{ alignItems: 'center', gap: 1.5 }}>
                <CircularProgress size={22} />
                <Typography variant="body2" color="text.secondary">
                  Loading the map…
                </Typography>
              </Stack>
            </Paper>
          }
        >
          <RouteMap stops={drawnStops} label={mapLabel} />
        </Suspense>
      </Box>
    </>
  );
}
