import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { nowLocalIso } from '@/data/format';
import {
  CURRENT_USER,
  EVENTS,
  PEOPLE,
  SEED_JOINED,
  SEED_MESSAGES,
  SEED_REVIEWS,
  getSpot,
} from '@/data/mockData';
import { GALLERY } from '@/data/gallery';

/**
 * Frontend-only application state.
 *
 * Joining an event, posting a review and sending a message all really work —
 * they just land here instead of in a database. State is mirrored to
 * localStorage so a refresh does not wipe what you did, which is what makes
 * the prototype feel like an app rather than a slideshow.
 *
 * Every write below is the shape a mutation would take against a real API,
 * so wiring one up later means replacing the bodies of these callbacks.
 */

const AppStateContext = createContext(null);

const STORAGE_KEY = 'fuchsia.state.v1';

function readStored() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    // Private browsing, blocked storage, corrupt JSON — all non-fatal.
    return null;
  }
}

function writeStored(value) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* Storage is a convenience here, never a requirement. */
  }
}

export function AppStateProvider({ children }) {
  const stored = useMemo(readStored, []);

  const [signedIn, setSignedIn] = useState(stored?.signedIn ?? false);
  const [joinedEventIds, setJoinedEventIds] = useState(stored?.joinedEventIds ?? SEED_JOINED);
  const [savedSpotIds, setSavedSpotIds] = useState(stored?.savedSpotIds ?? []);
  const [reviewsBySpot, setReviewsBySpot] = useState(stored?.reviewsBySpot ?? SEED_REVIEWS);
  const [messagesByEvent, setMessagesByEvent] = useState(
    stored?.messagesByEvent ?? SEED_MESSAGES,
  );
  const [customEvents, setCustomEvents] = useState(stored?.customEvents ?? []);
  // The signed-in user's own profile is editable; everyone else's is fixed
  // mock data. Keeping only the overrides here means a change to the seed
  // data still shows up for fields the user has never touched.
  const [profileEdits, setProfileEdits] = useState(stored?.profileEdits ?? {});
  const [myGalleryAdds, setMyGalleryAdds] = useState(stored?.myGalleryAdds ?? []);
  const [removedPostIds, setRemovedPostIds] = useState(stored?.removedPostIds ?? []);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    writeStored({
      signedIn,
      joinedEventIds,
      savedSpotIds,
      reviewsBySpot,
      messagesByEvent,
      customEvents,
      profileEdits,
      myGalleryAdds,
      removedPostIds,
    });
  }, [
    signedIn,
    joinedEventIds,
    savedSpotIds,
    reviewsBySpot,
    messagesByEvent,
    customEvents,
    profileEdits,
    myGalleryAdds,
    removedPostIds,
  ]);

  /**
   * Seed events plus anything created in this browser. Components read
   * events through here rather than importing the fixture directly, so a
   * newly created paint-out shows up everywhere at once.
   */
  const allEvents = useMemo(() => [...customEvents, ...EVENTS], [customEvents]);
  const findEvent = useCallback((id) => allEvents.find((e) => e.id === id), [allEvents]);

  /* ---------------------------------------------------------------- *
   *  Profiles and privacy
   * ---------------------------------------------------------------- */

  /** The signed-in user, with any edits they have made applied on top. */
  const me = useMemo(() => ({ ...CURRENT_USER, ...profileEdits }), [profileEdits]);

  const getProfile = useCallback(
    (userId) => (userId === CURRENT_USER.id ? me : PEOPLE[userId]),
    [me],
  );

  /**
   * The single privacy rule in the app.
   *
   * A public profile's gallery is visible to anyone. A private one is
   * visible only to its owner. Every surface that renders gallery content
   * asks this rather than reading `visibility` itself, so the rule cannot
   * drift apart between pages.
   */
  const canViewGallery = useCallback(
    (userId) => {
      if (userId === CURRENT_USER.id) return true;
      return PEOPLE[userId]?.visibility === 'public';
    },
    [],
  );

  const updateProfile = useCallback((changes) => {
    setProfileEdits((prev) => ({ ...prev, ...changes }));
    setToast('Profile updated.');
  }, []);

  const setVisibility = useCallback((visibility) => {
    setProfileEdits((prev) => ({ ...prev, visibility }));
    setToast(
      visibility === 'private'
        ? 'Your profile is private. Only you can see your gallery.'
        : 'Your profile is public. Anyone can see your gallery.',
    );
  }, []);

  /** Seed posts plus anything added here, minus anything removed. */
  const galleryFor = useCallback(
    (userId) => {
      const seed = GALLERY[userId] ?? [];
      const posts = userId === CURRENT_USER.id ? [...myGalleryAdds, ...seed] : seed;
      return posts.filter((post) => !removedPostIds.includes(post.id));
    },
    [myGalleryAdds, removedPostIds],
  );

  const addGalleryPost = useCallback((draft) => {
    const post = {
      id: `g-new-${Date.now()}`,
      kind: draft.kind,
      scene: draft.scene,
      title: draft.title.trim(),
      medium: draft.kind === 'artwork' ? draft.medium.trim() : undefined,
      caption: draft.caption.trim(),
      spotId: draft.spotId || undefined,
      date: nowLocalIso().slice(0, 10),
      likes: 0,
      mine: true,
    };
    setMyGalleryAdds((prev) => [post, ...prev]);
    setToast('Added to your gallery.');
    return post;
  }, []);

  const removeGalleryPost = useCallback((postId) => {
    setRemovedPostIds((prev) => (prev.includes(postId) ? prev : [...prev, postId]));
    setToast('Removed from your gallery.');
  }, []);

  const isJoined = useCallback(
    (eventId) => joinedEventIds.includes(eventId),
    [joinedEventIds],
  );

  const isHosting = useCallback(
    (eventId) => findEvent(eventId)?.hostId === CURRENT_USER.id,
    [findEvent],
  );

  const toggleJoin = useCallback(
    (eventId) => {
      setJoinedEventIds((prev) => {
        const joined = prev.includes(eventId);
        setToast(joined ? 'Left the event.' : 'You’re going. See you there!');
        return joined ? prev.filter((id) => id !== eventId) : [...prev, eventId];
      });
    },
    [],
  );

  const toggleSaveSpot = useCallback((spotId) => {
    setSavedSpotIds((prev) => {
      const saved = prev.includes(spotId);
      setToast(saved ? 'Removed from your spots.' : 'Spot saved.');
      return saved ? prev.filter((id) => id !== spotId) : [...prev, spotId];
    });
  }, []);

  /**
   * Create a paint-out. Builds the same shape as the seed data so every
   * component downstream treats it identically, and auto-joins the host.
   */
  const createEvent = useCallback((draft) => {
    const spot = getSpot(draft.spotId);
    const id = `custom-${Date.now()}`;
    const event = {
      id,
      title: draft.title.trim(),
      badge: draft.badge || 'Community paint-out',
      spotId: draft.spotId,
      meetingPoint: draft.meetingPoint.trim() || spot.address,
      hostId: CURRENT_USER.id,
      skillNote: draft.skillNote || 'All skill levels welcome',
      // The date inputs give a local wall clock; store it with Alberta's
      // offset so it formats through the same path as everything else.
      start: `${draft.date}T${draft.startTime}:00-07:00`,
      end: `${draft.date}T${draft.endTime}:00-07:00`,
      timezone: 'Mountain Standard Time',
      attendees: 1,
      scene: spot.scene,
      headline: draft.title.trim(),
      description: [draft.description.trim() || 'Come and make something outside with us.'],
      kit: { title: 'Bring your outdoor kit', body: 'Whatever you like to work with, plus layers.' },
      weatherNote: {
        title: 'Check the forecast',
        body: 'Alberta weather turns fast. Watch the chat for changes.',
      },
      gallery: [spot.scene, 'palette', 'meadow'],
      custom: true,
    };
    setCustomEvents((prev) => [event, ...prev]);
    setJoinedEventIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setToast('Your paint-out is live.');
    return event;
  }, []);

  const addReview = useCallback((spotId, { rating, body }) => {
    const review = {
      id: `r-${Date.now()}`,
      authorId: CURRENT_USER.id,
      date: nowLocalIso(),
      rating,
      body: body.trim(),
      mine: true,
    };
    setReviewsBySpot((prev) => ({ ...prev, [spotId]: [review, ...(prev[spotId] ?? [])] }));
    setToast('Thanks — your review is live.');
  }, []);

  const sendMessage = useCallback((eventId, body) => {
    const text = body.trim();
    if (!text) return;
    const message = {
      id: `m-${Date.now()}`,
      authorId: CURRENT_USER.id,
      at: nowLocalIso(),
      body: text,
    };
    setMessagesByEvent((prev) => ({ ...prev, [eventId]: [...(prev[eventId] ?? []), message] }));
  }, []);

  const value = useMemo(
    () => ({
      user: me,
      getProfile,
      canViewGallery,
      updateProfile,
      setVisibility,
      galleryFor,
      addGalleryPost,
      removeGalleryPost,
      allEvents,
      findEvent,
      createEvent,
      signedIn,
      signIn: () => setSignedIn(true),
      signOut: () => setSignedIn(false),
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
      me,
      getProfile,
      canViewGallery,
      updateProfile,
      setVisibility,
      galleryFor,
      addGalleryPost,
      removeGalleryPost,
      allEvents,
      findEvent,
      createEvent,
      signedIn,
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
