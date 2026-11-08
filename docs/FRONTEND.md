# Fuchsia — frontend

Vite + React (JavaScript) + Material UI + OpenLayers. No backend: every
screen runs on mock data and local state, and the interactions really work.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle into dist/
npm run preview  # serve the built bundle
```

## Screens

| Route | What it is |
| --- | --- |
| `/login` | Sign in — username and phone, per the design |
| `/signup` | Create an account — username, email, phone, password |
| `/discover` | Map of Alberta, spot browser, search and region filters |
| `/spots/:spotId` | Spot detail, upcoming events, reviews, review dialog |
| `/events/:eventId` | Event detail, join/leave, meeting point, gallery |
| `/chats/:eventId` | Event chat with conversation list and composer |
| `/my-events` | Upcoming and past, sortable, with status chips |

`/discover` was not in the supplied designs, but every header links to it,
so the app needs it to hold together. It is built from the same components
and rhythm as the screens that were specified.

## The map

`components/map/AlbertaMap.jsx`, built on OpenLayers. Thirty-one painting
spots across eight regions — Calgary, the Rockies, the foothills, the
badlands, central Alberta, Edmonton, the north and the prairie — each with
real coordinates in `data/mockData.js`.

Adding a spot means adding one object to `SPOTS` with `lonLat`, `region`
and a `scene` (the illustration variant). The map, the region filters, the
Discover grid and the counts all read from that one array, so nothing else
needs touching. A new `region` string automatically needs adding to
`FILTERS` in `DiscoverPage.jsx` — that list is explicit so the chip order
stays deliberate rather than alphabetical.

The grid shows the first twelve spots with a "Show all" control; the map
always plots the full filtered set, because a hidden card would mean a pin
with nothing to click through to.

Two things worth knowing before changing it:

**Both basemaps are free and need no API key.** "Map" is standard
OpenStreetMap; "Terrain" is OpenTopoMap, which is the more useful of the
two here because relief is how you find a viewpoint worth painting from.
Avoid the obvious prettier alternatives: CARTO Positron and Stadia's
Stamen styles now watermark or reject unkeyed requests. OSM's stock palette
is loud next to the brand magenta, so the tile layer carries a CSS
`saturate(0.66)` filter rather than a different tile source.

Both providers require visible attribution, which is why the OpenLayers
attribution control is set `collapsible: false`. Leave it that way. Their
tile servers are also fine for development but not for production traffic —
a real launch wants a tile host of your own or a paid provider.

**The province outline is still drawn**, as a magenta boundary over the
tiles, with everything outside it knocked back by a mask polygon (world
ring, Alberta-shaped hole). `data/alberta.js` holds that outline — three of
Alberta's four borders are straight lines and the fourth follows the
Continental Divide, so it takes about thirty coordinates. It doubles as the
offline fallback: if the tiles never arrive you still get a recognisable
Alberta with the pins on it.

**The map and the list are one thing.** Hovering a spot card, or a row in
the panel beside the map, highlights the matching pin, and hovering a pin
highlights the card. That runs through the `activeSpotId` / `onHoverSpot`
pair held by `DiscoverPage`. Region filters and the search box drive both
at once. Selecting a spot flies the view to it and opens a preview card.

OpenLayers is ~330 kB, so the component is behind `React.lazy` and its own
Rollup chunk. Discover's search, filters and grid are usable while the map
is still arriving.

## How it is put together

```
src/
  theme/            MUI theme — brand tokens, component defaults
  data/             mockData.js (content) · format.js (dates)
  state/AppState.jsx   joins, saves, reviews, messages
  components/
    layout/         AppHeader, AppFooter, AppShell, AuthShell
    common/         BrandMark, SceneImage, PersonAvatar, Stars, …
    events/         EventCard, SpotCard
    reviews/        ReviewDialog
  features/auth/    LoginPage, SignUpPage, fields, validation
  pages/            one file per route
```

**State.** `AppState.jsx` holds everything that changes: which events you
have joined, which spots you saved, reviews you wrote, messages you sent.
Each is mirrored to `localStorage`, so a refresh keeps your changes. Every
write is shaped like the mutation a real API would take — connecting a
backend means replacing the body of a callback, not restructuring the app.

**Images.** There are none. `SceneImage` draws every landscape as an SVG
from seeded noise: no stock licences, no external image host, a few
kilobytes of markup instead of megabytes of JPEG, and the same spot looks
identical on every reload. Add a variant by adding an entry to `VARIANTS`.

**Dates.** `format.js` deliberately does *not* resolve a named IANA
timezone. Chrome and Node disagree about `America/Edmonton` in late 2026 —
the same instant renders an hour apart — so anything leaning on the
platform's tz database drifts between runtimes. Timestamps are stored as a
wall-clock reading with its offset attached and displayed verbatim. Use
`nowLocalIso()` when creating new timestamps so they format through the
same path.

## Gotchas worth knowing

All of these bit this codebase and were fixed; they will bite again.

1. **`width: 1` in `sx` means `100%`, not `1px`.** A hand-rolled
   visually-hidden style using `width: 1` produced a full-width element and
   blew the page out to 2594px. Use `components/common/visuallyHidden.js`.

2. **MUI v9 removed system props from `Stack`.** `justifyContent="..."` and
   `alignItems="..."` are silently ignored — they must go inside `sx`.
   Likewise `aria-label` on `<TextField>` lands on the wrapper div, not the
   input; pass it through `slotProps.htmlInput`.

3. **Don't `import Map from 'ol/Map'`.** It shadows the global `Map`
   constructor, so a plain `new Map()` elsewhere in the same file quietly
   builds an OpenLayers map and the page dies on `.entries()`. The map
   component imports it as `OlMap`.

4. **`event.currentTarget` is null after an `await`.** Capture the element
   into a local before yielding, or a menu anchored to it never opens.

5. **`navigator.share` is a trap on desktop.** Chrome exposes it and then
   hands off to an OS sheet whose promise does not settle until the person
   dismisses it, and dismissal is indistinguishable from failure.
   `ShareMenu` uses a plain menu on every platform instead.

## Accessibility

- One `<h1>` per page; a single `<main>` landmark.
- Every input has a real label; errors come through MUI helper text so they
  are announced, not just coloured.
- Submitting an invalid form announces how many fields need attention and
  moves focus to the first one.
- The password reveal keeps a stable name and expresses state through
  `aria-pressed`; strength is mirrored into a polite live region.
- Decorative artwork is `aria-hidden`; `SceneImage` only takes a `title`
  where the picture carries meaning.
- `prefers-reduced-motion` disables the parallax on the auth artwork.

## Connecting a backend later

The two places to start:

- `features/auth/LoginPage.jsx` and `SignUpPage.jsx` — `handleSubmit` is
  where the auth call goes. Nothing is transmitted or stored today.
- `state/AppState.jsx` — `toggleJoin`, `createEvent`, `addReview`,
  `sendMessage`, `toggleSaveSpot`. Components read events through
  `allEvents` / `findEvent` rather than importing the fixture, so anything
  created locally appears everywhere at once.
