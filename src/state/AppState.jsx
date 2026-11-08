import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { nowLocalIso } from '@/data/format';
import { apiFetch } from '@/lib/api';

/**
 * Application state.
 *
 * Auth0 owns sign-in. Everything the screens list or change is loaded from
 * GET /api/bootstrap/ and written back through the matching API route.
 * Components keep reading people, spots, and events through the helpers
 * below, so a row's id is whatever the database assigned.
 */

const AppStateContext = createContext(null);

const SUBJECT_NAME = /^(google-oauth2|auth0|github|facebook|apple|windowslive)[.|]/;

function looksLikeSubject(name) {
  return SUBJECT_NAME.test(String(name || '').trim());
}

/** Person's name from the Auth0 ID token. Access tokens omit this unless an Action copies it. */
function personNameFromAuth(authUser) {
  const given = [authUser?.given_name, authUser?.family_name].filter(Boolean).join(' ').trim();
  const name = given || String(authUser?.name || '').trim();
  if (!name || looksLikeSubject(name) || name.includes('@')) return '';
  return name;
}

function initialsFromName(name) {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function AppStateProvider({ children }) {
  const {
    user: authUser,
    isAuthenticated,
    isLoading: authLoading,
    getAccessTokenSilently,
    loginWithRedirect,
  } = useAuth0();

  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState(null);
  const [toast, setToast] = useState(null);

  const auth = useMemo(
    () => ({
      getAccessTokenSilently,
      onUnauthorized: () => {
        loginWithRedirect({ appState: { returnTo: window.location.pathname } });
      },
    }),
    [getAccessTokenSilently, loginWithRedirect],
  );

  useEffect(() => {
    if (authLoading) return undefined;
    if (!isAuthenticated) {
      setCatalog(null);
      setCatalogError(null);
      return undefined;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch(auth, '/api/bootstrap/');
        const realName = personNameFromAuth(authUser);
        if (realName && looksLikeSubject(data?.me?.name)) {
          const person = await apiFetch(auth, '/api/profiles/me/', {
            method: 'PATCH',
            body: JSON.stringify({ name: realName }),
          });
          data.me = person;
          data.people = (data.people || []).map((row) => (row.id === person.id ? person : row));
        }
        if (!cancelled) {
          setCatalog(data);
          setCatalogError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setCatalog(null);
          setCatalogError(err?.message || 'Could not load Fuchsia.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, auth, authUser?.sub, authUser?.name, authUser?.given_name, authUser?.family_name]);

  const me = catalog?.me ?? null;
  const people = catalog?.people ?? [];
  const spots = catalog?.spots ?? [];
  const routes = catalog?.routes ?? [];
  const allEvents = catalog?.events ?? [];
  const pastEvents = catalog?.pastEvents ?? [];
  const joinedEventIds = catalog?.joinedEventIds ?? [];
  const savedSpotIds = catalog?.savedSpotIds ?? [];
  const reviewsBySpot = catalog?.reviews ?? {};
  const messagesByEvent = catalog?.messages ?? {};

  const peopleById = useMemo(() => {
    const map = {};
    for (const person of people) map[person.id] = person;
    if (me) map[me.id] = { ...map[me.id], ...me, initials: me.initials || initialsFromName(me.name) };
    return map;
  }, [people, me]);

  const spotsById = useMemo(() => {
    const map = {};
    for (const spot of spots) map[spot.id] = spot;
    return map;
  }, [spots]);

  const getSpot = useCallback((id) => (id ? spotsById[id] : undefined), [spotsById]);
  const getProfile = useCallback((userId) => peopleById[userId], [peopleById]);
  const findEvent = useCallback(
    (id) => allEvents.find((event) => event.id === id) || pastEvents.find((event) => event.id === id),
    [allEvents, pastEvents],
  );
  const eventsAtSpot = useCallback(
    (spotId) => allEvents.filter((event) => event.spotId === spotId),
    [allEvents],
  );

  const canViewGallery = useCallback(
    (userId) => {
      if (!userId) return false;
      if (userId === me?.id) return true;
      return peopleById[userId]?.visibility === 'public';
    },
    [me, peopleById],
  );

  const galleryFor = useCallback(
    (userId) => catalog?.gallery?.[userId] ?? [],
    [catalog],
  );
  const galleryCount = useCallback(
    (userId) => catalog?.galleryCounts?.[userId] ?? (catalog?.gallery?.[userId]?.length ?? 0),
    [catalog],
  );

  const fail = useCallback((err, fallback) => {
    setToast(err?.message || fallback);
  }, []);

  const updateProfile = useCallback(
    async (changes) => {
      const person = await apiFetch(auth, '/api/profiles/me/', {
        method: 'PATCH',
        body: JSON.stringify(changes),
      });
      setCatalog((prev) => ({
        ...prev,
        me: person,
        people: prev.people.map((row) => (row.id === person.id ? person : row)),
      }));
      if (changes.visibility && changes.visibility !== me?.visibility && Object.keys(changes).length === 1) {
        setToast(
          changes.visibility === 'private'
            ? 'Your profile is private. Only you can see your gallery.'
            : 'Your profile is public. Anyone can see your gallery.',
        );
      } else {
        setToast('Profile updated.');
      }
      return person;
    },
    [auth, me],
  );

  const setVisibility = useCallback(
    (visibility) => updateProfile({ visibility }),
    [updateProfile],
  );

  const isJoined = useCallback(
    (eventId) => joinedEventIds.includes(eventId),
    [joinedEventIds],
  );
  const isHosting = useCallback(
    (eventId) => findEvent(eventId)?.hostId === me?.id,
    [findEvent, me],
  );

  const toggleJoin = useCallback(
    async (eventId) => {
      if (findEvent(eventId)?.hostId === me?.id) return;
      const joined = joinedEventIds.includes(eventId);
      try {
        const result = await apiFetch(auth, `/api/events/${eventId}/${joined ? 'leave' : 'join'}/`, {
          method: 'POST',
          body: '{}',
        });
        setCatalog((prev) => ({
          ...prev,
          joinedEventIds: result.joinedEventIds,
          events: prev.events.map((event) => (event.id === result.event.id ? result.event : event)),
          pastEvents: prev.pastEvents.map((event) => (event.id === result.event.id ? result.event : event)),
        }));
        setToast(joined ? 'Left the event.' : 'You’re going. See you there!');
      } catch (err) {
        fail(err, 'Could not update your spot on that event.');
      }
    },
    [auth, fail, findEvent, joinedEventIds, me],
  );

  const toggleSaveSpot = useCallback(
    async (spotId) => {
      const saved = savedSpotIds.includes(spotId);
      try {
        const result = await apiFetch(auth, `/api/spots/${spotId}/save/`, {
          method: 'POST',
          body: '{}',
        });
        setCatalog((prev) => ({ ...prev, savedSpotIds: result.savedSpotIds }));
        setToast(saved ? 'Removed from your spots.' : 'Spot saved.');
      } catch (err) {
        fail(err, 'Could not save that spot.');
      }
    },
    [auth, fail, savedSpotIds],
  );

  const createRoute = useCallback(
    async (draft) => {
      try {
        const result = await apiFetch(auth, '/api/routes/', {
          method: 'POST',
          body: JSON.stringify({
            name: draft.name.trim(),
            description: (draft.description || '').trim(),
            spotIds: draft.spotIds,
          }),
        });
        setCatalog((prev) => ({
          ...prev,
          routes: [result.route, ...(prev.routes || []).filter((route) => route.id !== result.route.id)],
        }));
        setToast('Route saved.');
        return result.route;
      } catch (err) {
        fail(err, 'Could not save that route.');
        return null;
      }
    },
    [auth, fail],
  );

  const inviteToRoute = useCallback(
    async (routeId, userId) => {
      try {
        const result = await apiFetch(auth, `/api/routes/${routeId}/invite/`, {
          method: 'POST',
          body: JSON.stringify({ userId }),
        });
        setCatalog((prev) => ({
          ...prev,
          routes: (prev.routes || []).map((route) => (route.id === result.route.id ? result.route : route)),
        }));
        setToast('Invite sent.');
        return result.route;
      } catch (err) {
        fail(err, 'Could not send that invite.');
        return null;
      }
    },
    [auth, fail],
  );

  const respondToRoute = useCallback(
    async (routeId, status) => {
      try {
        const result = await apiFetch(auth, `/api/routes/${routeId}/respond/`, {
          method: 'POST',
          body: JSON.stringify({ status }),
        });
        setCatalog((prev) => ({
          ...prev,
          routes: (prev.routes || []).map((route) => (route.id === result.route.id ? result.route : route)),
        }));
        setToast(status === 'accepted' ? "You're on the route." : "You won't be joining this route.");
        return result.route;
      } catch (err) {
        fail(err, 'Could not update that invite.');
        return null;
      }
    },
    [auth, fail],
  );

  const joinRoute = useCallback(
    async (routeId, file) => {
      if (!file) {
        setToast('Take a photo to confirm you joined.');
        return null;
      }
      try {
        const body = new FormData();
        body.append('image', file);
        const result = await apiFetch(auth, `/api/routes/${routeId}/join/`, {
          method: 'POST',
          body,
        });
        setCatalog((prev) => ({
          ...prev,
          routes: (prev.routes || []).map((route) => (route.id === result.route.id ? result.route : route)),
        }));
        setToast("You're on the route.");
        return result.route;
      } catch (err) {
        fail(err, 'Could not join that route.');
        return null;
      }
    },
    [auth, fail],
  );

  const leaveRoute = useCallback(
    async (routeId) => {
      try {
        const result = await apiFetch(auth, `/api/routes/${routeId}/leave/`, {
          method: 'POST',
          body: '{}',
        });
        setCatalog((prev) => ({
          ...prev,
          routes: (prev.routes || []).map((route) => (route.id === result.route.id ? result.route : route)),
        }));
        setToast('You left the route.');
        return result.route;
      } catch (err) {
        fail(err, 'Could not leave that route.');
        return null;
      }
    },
    [auth, fail],
  );

  const createEvent = useCallback(
    async (draft) => {
      const spot = spotsById[draft.spotId];
      if (!spot) return null;
      const payload = {
        title: draft.title.trim(),
        badge: draft.badge || 'Community paint-out',
        spotId: draft.spotId,
        meetingPoint: draft.meetingPoint.trim() || spot.address,
        skillNote: draft.skillNote || 'All skill levels welcome',
        start: `${draft.date}T${draft.startTime}:00-07:00`,
        end: `${draft.date}T${draft.endTime}:00-07:00`,
        timezone: 'Mountain Standard Time',
        scene: spot.scene,
        headline: draft.title.trim(),
        description: [draft.description.trim() || 'Come and make something outside with us.'],
        kit: { title: 'Bring your outdoor kit', body: 'Whatever you like to work with, plus layers.' },
        weatherNote: {
          title: 'Check the forecast',
          body: 'Alberta weather turns fast. Watch the chat for changes.',
        },
        gallery: [spot.scene, 'palette', 'meadow'],
      };
      try {
        const result = await apiFetch(auth, '/api/events/', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setCatalog((prev) => ({
          ...prev,
          events: [result.event, ...prev.events.filter((event) => event.id !== result.event.id)],
          joinedEventIds: result.joinedEventIds,
        }));
        setToast('Your paint-out is live.');
        return result.event;
      } catch (err) {
        fail(err, 'Could not create that paint-out.');
        return null;
      }
    },
    [auth, fail, spotsById],
  );

  const addReview = useCallback(
    async (spotId, { rating, body }) => {
      try {
        const review = await apiFetch(auth, `/api/spots/${spotId}/reviews/`, {
          method: 'POST',
          body: JSON.stringify({
            rating,
            body: body.trim(),
            date: nowLocalIso().slice(0, 10),
          }),
        });
        setCatalog((prev) => {
          const existing = prev.reviews?.[spotId] ?? [];
          return {
            ...prev,
            reviews: {
              ...prev.reviews,
              [spotId]: [review, ...existing.filter((row) => row.id !== review.id)],
            },
          };
        });
        setToast('Thanks — your review is live.');
      } catch (err) {
        fail(err, 'Could not post that review.');
      }
    },
    [auth, fail],
  );

  const sendMessage = useCallback(
    async (eventId, body) => {
      const text = body.trim();
      if (!text) return;
      try {
        const message = await apiFetch(auth, `/api/events/${eventId}/messages/`, {
          method: 'POST',
          body: JSON.stringify({ body: text, at: nowLocalIso() }),
        });
        setCatalog((prev) => ({
          ...prev,
          messages: {
            ...prev.messages,
            [eventId]: [...(prev.messages?.[eventId] ?? []), message],
          },
        }));
      } catch (err) {
        fail(err, 'Could not send that message.');
      }
    },
    [auth, fail],
  );

  const addGalleryPost = useCallback(
    async (draft) => {
      try {
        const body = new FormData();
        body.append('kind', draft.kind);
        body.append('title', draft.title.trim());
        body.append('medium', draft.kind === 'artwork' ? draft.medium.trim() : '');
        body.append('caption', draft.caption.trim());
        body.append('spotId', draft.spotId || '');
        body.append('date', nowLocalIso().slice(0, 10));
        body.append('image', draft.file);
        const post = await apiFetch(auth, '/api/gallery-posts/', {
          method: 'POST',
          body,
        });
        setCatalog((prev) => {
          const ownerId = prev.me.id;
          const posts = prev.gallery?.[ownerId] ?? [];
          return {
            ...prev,
            gallery: { ...prev.gallery, [ownerId]: [post, ...posts] },
            galleryCounts: {
              ...prev.galleryCounts,
              [ownerId]: (prev.galleryCounts?.[ownerId] ?? posts.length) + 1,
            },
          };
        });
        setToast('Added to your gallery.');
        return post;
      } catch (err) {
        fail(err, 'Could not add that to your gallery.');
        return null;
      }
    },
    [auth, fail],
  );

  const removeGalleryPost = useCallback(
    async (postId) => {
      try {
        await apiFetch(auth, `/api/gallery-posts/${postId}/`, { method: 'DELETE' });
        setCatalog((prev) => {
          const ownerId = prev.me.id;
          const posts = (prev.gallery?.[ownerId] ?? []).filter((post) => post.id !== postId);
          return {
            ...prev,
            gallery: { ...prev.gallery, [ownerId]: posts },
            galleryCounts: {
              ...prev.galleryCounts,
              [ownerId]: Math.max(0, (prev.galleryCounts?.[ownerId] ?? 1) - 1),
            },
          };
        });
        setToast('Removed from your gallery.');
      } catch (err) {
        fail(err, 'Could not remove that post.');
      }
    },
    [auth, fail],
  );

  const user = me;

  const value = useMemo(
    () => ({
      user,
      people,
      spots,
      routes,
      getProfile,
      getSpot,
      eventsAtSpot,
      canViewGallery,
      updateProfile,
      setVisibility,
      galleryFor,
      galleryCount,
      addGalleryPost,
      removeGalleryPost,
      allEvents,
      pastEvents,
      findEvent,
      createEvent,
      createRoute,
      inviteToRoute,
      respondToRoute,
      joinRoute,
      leaveRoute,
      signedIn: isAuthenticated,
      catalogLoading: authLoading || (isAuthenticated && !catalog && !catalogError),
      catalogError,
      signOut: () => {
        setCatalog(null);
      },
      joinedEventIds,
      isJoined,
      isHosting,
      toggleJoin,
      savedSpotIds,
      isSaved: (spotId) => savedSpotIds.includes(spotId),
      toggleSaveSpot,
      reviewsBySpot,
      addReview,
      messagesByEvent,
      sendMessage,
      toast,
      clearToast: () => setToast(null),
    }),
    [
      user,
      people,
      spots,
      routes,
      getProfile,
      getSpot,
      eventsAtSpot,
      canViewGallery,
      updateProfile,
      setVisibility,
      galleryFor,
      galleryCount,
      addGalleryPost,
      removeGalleryPost,
      allEvents,
      pastEvents,
      findEvent,
      createEvent,
      createRoute,
      inviteToRoute,
      respondToRoute,
      joinRoute,
      leaveRoute,
      isAuthenticated,
      authLoading,
      catalog,
      catalogError,
      joinedEventIds,
      isJoined,
      isHosting,
      toggleJoin,
      savedSpotIds,
      toggleSaveSpot,
      reviewsBySpot,
      addReview,
      messagesByEvent,
      sendMessage,
      toast,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside <AppStateProvider>');
  return ctx;
}
