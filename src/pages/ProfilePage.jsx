import { useMemo, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import PageBreadcrumbs from '@/components/common/PageBreadcrumbs';
import { PersonAvatar } from '@/components/common/PersonAvatar';
import ShareMenu from '@/components/common/ShareMenu';
import EventCard from '@/components/events/EventCard';
import RouteCard from '@/components/events/RouteCard';
import PrivacyBadge from '@/components/profile/PrivacyBadge';
import GalleryGrid, { LockedGallery } from '@/components/profile/GalleryGrid';
import GalleryPostDialog from '@/components/profile/GalleryPostDialog';
import AddArtworkDialog from '@/components/profile/AddArtworkDialog';
import ProfileSettingsDialog from '@/components/profile/ProfileSettingsDialog';
import NotFoundPage from './NotFoundPage';
import { formatLongDate } from '@/data/format';
import { routesForPerson } from '@/lib/routes';
import { useAppState } from '@/state/AppState';
import { BRAND, RADIUS, cardSx, tintSx } from '@/theme';

/** A labelled number in the profile header. */
function Stat({ value, label }) {
  return (
    <Box sx={{ textAlign: { xs: 'left', sm: 'center' } }}>
      <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', lineHeight: 1.2 }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

/**
 * One page for every profile — your own at `/profile`, anyone else's at
 * `/artists/:userId`.
 *
 * Keeping them in one component is what guarantees a private profile
 * looks the same to its owner as the public one does, minus the lock.
 * Two separate pages would drift.
 */
export default function ProfilePage({ own = false }) {
  const { userId } = useParams();
  const { user, getProfile, canViewGallery, galleryFor, galleryCount, allEvents, joinedEventIds, isHosting, routes } =
    useAppState();

  const id = own ? user?.id : userId;
  const person = getProfile(id);

  const [tab, setTab] = useState('gallery');
  const [openPost, setOpenPost] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const posts = galleryFor(id);
  const visible = canViewGallery(id);

  // Events this person is connected to. For you that is what you have
  // joined; for anyone else it is what they host, since attendance lists
  // are not something a profile should leak.
  const events = useMemo(() => {
    if (!person) return [];
    const list = own
      ? allEvents.filter((e) => joinedEventIds.includes(e.id))
      : allEvents.filter((e) => e.hostId === id);
    return [...list].sort((a, b) => a.start.localeCompare(b.start));
  }, [person, own, allEvents, joinedEventIds, id]);

  // Routes this person planned or joined. Membership is public, so the
  // same list appears on their page for everyone who opens it.
  const personRoutes = useMemo(() => routesForPerson(routes, id), [routes, id]);

  if (!person) return <NotFoundPage />;

  const isPrivate = person.visibility === 'private';
  // The count is the profile's own fact, so it is shown even when the
  // contents are not. It must come from the seed data, not the filtered
  // list, or a private gallery would always report zero.
  const hiddenCount = galleryCount(id);

  return (
    <>
      {!own ? (
        <PageBreadcrumbs
          items={[
            { label: 'Discover', to: '/discover' },
            { label: 'Artists', to: '/discover#artists' },
            { label: person.name },
          ]}
        />
      ) : null}

      {/* ---- Header ---- */}
      <Paper sx={{ ...cardSx, p: { xs: 2.5, md: 3.5 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 2.5, sm: 3 }}
          sx={{ alignItems: { sm: 'flex-start' } }}
        >
          <PersonAvatar personId={id} size={88} />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack
              direction="row"
              sx={{ flexWrap: 'wrap', alignItems: 'center', gap: 1.25, mb: 0.5 }}
            >
              <Typography variant="h1" component="h1" sx={{ fontSize: { xs: '1.75rem', md: '2.1rem' } }}>
                {person.name}
              </Typography>
              <PrivacyBadge
                visibility={person.visibility}
                ownHint={own ? 'Change this in Profile settings.' : undefined}
              />
            </Stack>

            <Typography variant="body2" color="text.secondary">
              @{person.handle}
              {person.pronouns ? ` · ${person.pronouns}` : ''}
            </Typography>

            {person.bio ? (
              <Typography sx={{ mt: 1.75, maxWidth: '62ch' }} color="text.secondary">
                {person.bio}
              </Typography>
            ) : null}

            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 2.5, mt: 2 }}>
              {person.city ? (
                <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
                  <PlaceOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {person.city}
                  </Typography>
                </Stack>
              ) : null}
              {person.joined ? (
                <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
                  <CalendarMonthRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    Joined {formatLongDate(person.joined)}
                  </Typography>
                </Stack>
              ) : null}
            </Stack>

            {person.mediums?.length ? (
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75, mt: 1.75 }}>
                {person.mediums.map((medium) => (
                  <Chip key={medium} size="small" variant="outlined" label={medium} />
                ))}
              </Stack>
            ) : null}
          </Box>

          <Stack spacing={1.25} sx={{ flexShrink: 0, width: { xs: '100%', sm: 'auto' } }}>
            {own ? (
              <>
                <Button
                  variant="contained"
                  startIcon={<SettingsOutlinedIcon />}
                  onClick={() => setSettingsOpen(true)}
                >
                  Profile settings
                </Button>
                <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={() => setAddOpen(true)}>
                  Add to gallery
                </Button>
              </>
            ) : (
              <ShareMenu
                title={person.name}
                text={`${person.name} on Fuchsia`}
                variant="outlined"
              >
                Share profile
              </ShareMenu>
            )}
          </Stack>
        </Stack>

        <Divider sx={{ my: 2.5 }} />

        <Stack direction="row" sx={{ gap: { xs: 3, sm: 5 }, flexWrap: 'wrap' }}>
          <Stat value={visible ? posts.length : hiddenCount} label={posts.length === 1 ? 'piece' : 'pieces'} />
          <Stat value={person.followers ?? 0} label="followers" />
          <Stat value={person.following ?? 0} label="following" />
          <Stat value={events.length} label={own ? 'upcoming' : 'hosting'} />
          <Stat value={personRoutes.length} label={personRoutes.length === 1 ? 'route' : 'routes'} />
        </Stack>
      </Paper>

      {/* ---- Your own privacy state, stated plainly ---- */}
      {own && isPrivate ? (
        <Paper sx={{ ...tintSx('magenta'), p: 2.25, mt: 2.5, display: 'flex', gap: 1.75 }}>
          <VisibilityOutlinedIcon sx={{ color: BRAND.magentaDark, mt: 0.25 }} />
          <Box>
            <Typography variant="subtitle2">Your gallery is private</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              Other artists can find you and see your name, but your work is visible only to you.
              You can change this any time in Profile settings.
            </Typography>
          </Box>
        </Paper>
      ) : null}

      {/* ---- Tabs ---- */}
      <Box sx={{ borderBottom: `1px solid ${BRAND.line}`, mt: 3.5 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="Profile sections">
          <Tab
            value="gallery"
            label={
              <Box component="span" sx={{ display: 'inline-flex', gap: 0.85, alignItems: 'baseline' }}>
                Art gallery
                <Box component="span" sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                  {visible ? posts.length : hiddenCount}
                </Box>
              </Box>
            }
          />
          <Tab
            value="events"
            label={
              <Box component="span" sx={{ display: 'inline-flex', gap: 0.85, alignItems: 'baseline' }}>
                {own ? 'My events' : 'Hosting'}
                <Box component="span" sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                  {events.length}
                </Box>
              </Box>
            }
          />
          <Tab
            value="routes"
            label={
              <Box component="span" sx={{ display: 'inline-flex', gap: 0.85, alignItems: 'baseline' }}>
                Routes
                <Box component="span" sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                  {personRoutes.length}
                </Box>
              </Box>
            }
          />
        </Tabs>
      </Box>

      <Box sx={{ mt: 3 }}>
        {tab === 'gallery' ? (
          !visible ? (
            <LockedGallery person={person} count={hiddenCount} />
          ) : posts.length ? (
            <GalleryGrid posts={posts} onOpen={setOpenPost} />
          ) : (
            <Paper sx={{ ...cardSx, p: 5, textAlign: 'center' }}>
              <Typography variant="h3">
                {own ? 'Nothing in your gallery yet' : 'No work shared yet'}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1, mb: own ? 3 : 0 }}>
                {own
                  ? 'Add a piece you are proud of, or a photo from a session.'
                  : `${person.name} hasn’t posted anything so far.`}
              </Typography>
              {own ? (
                <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setAddOpen(true)}>
                  Add to gallery
                </Button>
              ) : null}
            </Paper>
          )
        ) : tab === 'routes' ? (
          personRoutes.length ? (
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
              {personRoutes.map((route) => (
                <RouteCard key={route.id} route={route} badgeFor={id} />
              ))}
            </Box>
          ) : (
            <Paper sx={{ ...cardSx, p: 5, textAlign: 'center' }}>
              <Typography variant="h3">
                {own ? 'No routes yet' : `${person.name} isn’t on a route yet`}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1, mb: own ? 3 : 0 }}>
                {own
                  ? 'Join one from Discover, or plan your own. It will show up here for everyone.'
                  : 'When they join a walk, it will show up here.'}
              </Typography>
              {own ? (
                <Button component={RouterLink} to="/discover" variant="contained">
                  Browse routes
                </Button>
              ) : null}
            </Paper>
          )
        ) : events.length ? (
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
                status={isHosting(event.id) ? 'Hosting' : own ? 'Joined' : undefined}
                showActions={own}
              />
            ))}
          </Box>
        ) : (
          <Paper sx={{ ...cardSx, p: 5, textAlign: 'center' }}>
            <Typography variant="h3">
              {own ? 'No upcoming paint-outs' : `${person.name} isn’t hosting anything right now`}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, mb: own ? 3 : 0 }}>
              {own ? 'Join one from Discover and it will show up here.' : 'Check back another time.'}
            </Typography>
            {own ? (
              <Button component={RouterLink} to="/discover" variant="contained">
                Browse paint-outs
              </Button>
            ) : null}
          </Paper>
        )}
      </Box>

      <GalleryPostDialog
        post={openPost}
        owner={person}
        onClose={() => setOpenPost(null)}
        canDelete={own}
      />
      {own ? (
        <>
          <AddArtworkDialog open={addOpen} onClose={() => setAddOpen(false)} />
          <ProfileSettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </>
      ) : null}
    </>
  );
}
