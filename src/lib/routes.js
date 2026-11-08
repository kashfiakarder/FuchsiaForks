/** Ordered stops, as the route was planned. */
export function stopsFor(route) {
  return [...(route?.stops ?? [])].sort((a, b) => a.order - b.order);
}

/** A photo is what makes a join real. An accepted row without one does not count. */
export function hasJoined(invite) {
  return invite?.status === 'accepted' && Boolean(invite.photoUrl);
}

/** Host first, then everyone whose photo confirmed they joined. */
export function memberIds(route) {
  const ids = [];
  if (route?.hostId) ids.push(route.hostId);
  for (const invite of route?.invites ?? []) {
    if (hasJoined(invite) && !ids.includes(invite.userId)) ids.push(invite.userId);
  }
  return ids;
}

/**
 * How this person relates to the route.
 * `host` planned it, `joined` posted a photo, `invited` has not answered yet.
 */
export function membership(route, userId) {
  if (!route || !userId) return null;
  if (route.hostId === userId) return 'host';
  const invite = (route.invites ?? []).find((row) => row.userId === userId);
  if (hasJoined(invite)) return 'joined';
  if (invite?.status === 'pending') return 'invited';
  return null;
}

/** Routes this person planned or joined. Visible on their profile to everyone. */
export function routesForPerson(routes, userId) {
  if (!userId) return [];
  return (routes ?? []).filter((route) => membership(route, userId) === 'host' || membership(route, userId) === 'joined');
}
