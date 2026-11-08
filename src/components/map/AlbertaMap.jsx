import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import MyLocationRoundedIcon from '@mui/icons-material/MyLocationRounded';
import NorthEastRoundedIcon from '@mui/icons-material/NorthEastRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import { Link as RouterLink } from 'react-router-dom';

import OlMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import { fromLonLat } from 'ol/proj';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { defaults as defaultControls } from 'ol/control';
import 'ol/ol.css';

import SceneImage from '@/components/common/SceneImage';
import { createUserLocationLayer, setUserLocationFeature, useUserLocation } from '@/components/map/userLocation';
import { ALBERTA_OUTLINE } from '@/data/alberta';
import { BRAND, RADIUS, cardSx } from '@/theme';

/** Breathing room around the province when the view is fitted to it. */
const FIT_PADDING = [28, 28, 44, 28];

/* ------------------------------------------------------------------ *
 *  Styles
 *
 *  Built once at module scope. OpenLayers calls the style function for
 *  every feature on every frame, so allocating Style objects inside it
 *  would churn garbage through every pan and zoom.
 * ------------------------------------------------------------------ */

/**
 * The province boundary, drawn over the tiles. The faint fill is a
 * fallback: if the tile server is unreachable the outline still renders,
 * so the map degrades to a recognisable Alberta rather than to nothing.
 */
const provinceStyle = new Style({
  fill: new Fill({ color: 'rgba(236, 239, 234, 0.35)' }),
  stroke: new Stroke({ color: BRAND.magenta, width: 1.6 }),
});

/**
 * Everything outside Alberta, knocked back.
 *
 * One polygon whose outer ring is the world and whose inner ring is the
 * province, so the hole falls exactly on the border. It focuses the eye on
 * Alberta without hiding the surrounding geography entirely.
 */
const maskStyle = new Style({ fill: new Fill({ color: 'rgba(248, 248, 250, 0.68)' }) });

const WORLD_RING = [
  [-179.9, -85],
  [179.9, -85],
  [179.9, 85],
  [-179.9, 85],
  [-179.9, -85],
];

function spotStyle(active) {
  return new Style({
    image: new CircleStyle({
      radius: active ? 11 : 7,
      fill: new Fill({ color: active ? BRAND.magentaDark : BRAND.magenta }),
      stroke: new Stroke({ color: '#FFFFFF', width: active ? 3 : 2 }),
    }),
    zIndex: active ? 2 : 1,
  });
}

const SPOT_STYLE = spotStyle(false);
const SPOT_STYLE_ACTIVE = spotStyle(true);

/**
 * Alberta, with every painting spot on it.
 *
 * Two deliberate choices:
 *
 * 1. The default basemap is a vector outline of the province drawn from
 *    about thirty coordinates, not raster tiles. It matches the app's flat
 *    illustrated style, costs no network requests, and still works with no
 *    connection. "Street detail" switches on OpenStreetMap tiles for
 *    anyone who needs real-world context.
 *
 * 2. Hovering a card in the grid highlights its pin and vice versa, via
 *    the activeSpotId / onHoverSpot pair. The map and the grid are two
 *    views of one list and should behave like it.
 */
export default function AlbertaMap({ spots, activeSpotId, onHoverSpot, onSelectSpot, selectedSpot }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const provinceExtentRef = useRef(null);
  const spotSourceRef = useRef(null);
  const osmLayerRef = useRef(null);
  const lightLayerRef = useRef(null);
  const userSourceRef = useRef(null);
  const [basemap, setBasemap] = useState('light');
  const { location, status, request } = useUserLocation();
  const locationRef = useRef(location);
  locationRef.current = location;
  const focusMeRef = useRef(false);

  // Keep callbacks in refs: OpenLayers listeners are bound once, and
  // re-binding them on every render would thrash the map.
  const hoverRef = useRef(onHoverSpot);
  hoverRef.current = onHoverSpot;
  const selectRef = useRef(onSelectSpot);
  selectRef.current = onSelectSpot;

  /* ---- Build the map once ---- */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const albertaRing = ALBERTA_OUTLINE.map((c) => fromLonLat(c));
    const provinceGeometry = new Polygon([albertaRing]);
    provinceExtentRef.current = provinceGeometry.getExtent();

    // Outer ring first, hole second. The hole has to wind opposite to the
    // outer ring for the canvas fill rule to punch through it.
    const maskGeometry = new Polygon([WORLD_RING.map((c) => fromLonLat(c)), [...albertaRing].reverse()]);

    const mask = new VectorLayer({
      source: new VectorSource({ features: [new Feature(maskGeometry)] }),
      style: maskStyle,
    });

    const province = new VectorLayer({
      source: new VectorSource({ features: [new Feature(provinceGeometry)] }),
      style: provinceStyle,
    });

    const spotSource = new VectorSource();
    const spotLayer = new VectorLayer({
      source: spotSource,
      style: (feature) => (feature.get('active') ? SPOT_STYLE_ACTIVE : SPOT_STYLE),
    });
    const { source: userSource, layer: userLayer } = createUserLocationLayer();

    /**
     * Both basemaps are OpenStreetMap-derived, free and need no API key.
     * That rules out the obvious "nice light basemap" choices — CARTO's
     * Positron and Stadia's Stamen styles both now watermark or reject
     * unkeyed requests — so instead the standard OSM style is softened in
     * CSS (see `pa-basemap` below) to stop it shouting over the pins.
     */
    const light = new TileLayer({ source: new OSM(), className: 'ol-layer pa-basemap' });

    // Terrain, which is the more useful of the two for this app: relief
    // is how you find a viewpoint worth painting from.
    const osm = new TileLayer({
      source: new XYZ({
        url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attributions:
          'Map data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
          'SRTM | Style © <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
        maxZoom: 17,
        crossOrigin: 'anonymous',
      }),
      visible: false,
      className: 'ol-layer pa-basemap',
    });

    const map = new OlMap({
      target: containerRef.current,
      layers: [light, osm, mask, province, spotLayer, userLayer],
      view: new View({ center: fromLonLat([-114.6, 54.6]), zoom: 5, minZoom: 4, maxZoom: 14 }),
      // The rotate control is noise on a map nobody rotates.
      controls: defaultControls({ rotate: false, attributionOptions: { collapsible: false } }),
    });

    const pick = (event) =>
      map.forEachFeatureAtPixel(event.pixel, (f) => (f.get('spotId') ? f : undefined), {
        hitTolerance: 6,
      });

    map.on('pointermove', (event) => {
      if (event.dragging) return;
      const feature = pick(event);
      map.getTargetElement().style.cursor = feature ? 'pointer' : '';
      if (hoverRef.current) hoverRef.current(feature ? feature.get('spotId') : null);
    });

    map.on('click', (event) => {
      const feature = pick(event);
      if (feature && selectRef.current) selectRef.current(feature.get('spotId'));
    });

    // Fit to the province rather than hard-coding a zoom: the card is much
    // wider than Alberta is, and the right framing depends on the container.
    map.getView().fit(provinceExtentRef.current, { padding: FIT_PADDING });

    mapRef.current = map;
    spotSourceRef.current = spotSource;
    userSourceRef.current = userSource;
    osmLayerRef.current = osm;
    lightLayerRef.current = light;
    setUserLocationFeature(userSource, locationRef.current);

    return () => {
      map.setTarget(undefined);
      map.dispose();
      mapRef.current = null;
      userSourceRef.current = null;
    };
  }, []);

  useEffect(() => {
    setUserLocationFeature(userSourceRef.current, location);
    if (!location || !focusMeRef.current || !mapRef.current) return;
    focusMeRef.current = false;
    const view = mapRef.current.getView();
    view.animate({
      center: fromLonLat(location.lonLat),
      zoom: Math.max(view.getZoom() ?? 5, 12),
      duration: 520,
    });
  }, [location]);

  /* ---- Keep the pins in sync with the filtered list ---- */
  useEffect(() => {
    const source = spotSourceRef.current;
    if (!source) return;
    source.clear();
    source.addFeatures(
      spots.map(
        (spot) =>
          new Feature({
            geometry: new Point(fromLonLat(spot.lonLat)),
            spotId: spot.id,
            active: false,
          }),
      ),
    );
  }, [spots]);

  /* ---- Highlight whichever spot is hovered, here or in the grid ---- */
  useEffect(() => {
    const source = spotSourceRef.current;
    if (!source) return;
    for (const feature of source.getFeatures()) {
      const next = feature.get('spotId') === activeSpotId;
      if (feature.get('active') !== next) feature.set('active', next);
    }
  }, [activeSpotId, spots]);

  useEffect(() => {
    if (osmLayerRef.current) osmLayerRef.current.setVisible(basemap === 'street');
    if (lightLayerRef.current) lightLayerRef.current.setVisible(basemap === 'light');
  }, [basemap]);

  const showMe = useCallback(() => {
    focusMeRef.current = true;
    request();
    const current = locationRef.current;
    if (!current || !mapRef.current) return;
    focusMeRef.current = false;
    const view = mapRef.current.getView();
    view.animate({
      center: fromLonLat(current.lonLat),
      zoom: Math.max(view.getZoom() ?? 5, 12),
      duration: 520,
    });
  }, [request]);

  const resetView = useCallback(() => {
    if (!mapRef.current || !provinceExtentRef.current) return;
    mapRef.current.getView().fit(provinceExtentRef.current, {
      padding: FIT_PADDING,
      duration: 450,
    });
  }, []);

  /** Centre on one spot without zooming so far in that context is lost. */
  const flyTo = useCallback((spot) => {
    if (!mapRef.current || !spot) return;
    const view = mapRef.current.getView();
    view.animate({
      center: fromLonLat(spot.lonLat),
      zoom: Math.max(view.getZoom(), 8),
      duration: 520,
    });
  }, []);

  useEffect(() => {
    if (selectedSpot) flyTo(selectedSpot);
  }, [selectedSpot, flyTo]);

  const regionCounts = useMemo(() => {
    const counts = new Map();
    for (const spot of spots) counts.set(spot.region, (counts.get(spot.region) || 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [spots]);

  return (
    <Paper
      sx={{
        ...cardSx,
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.3fr) minmax(0, 1fr)' },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          borderRight: { md: `1px solid ${BRAND.line}` },
        }}
      >
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          minHeight: { xs: 360, sm: 420, md: 540 },
          bgcolor: '#F0F1F4',
          // OpenLayers ships its own control chrome; restyle it to match.
          '& .ol-zoom': { top: 'auto', bottom: 12, left: 12, background: 'none', padding: 0 },
          '& .ol-zoom button': {
            background: '#fff',
            color: BRAND.ink,
            border: `1px solid ${BRAND.line}`,
            borderRadius: `${RADIUS.sm}px`,
            width: 32,
            height: 32,
            fontSize: 18,
            margin: '0 0 4px',
            '&:hover': { background: '#FAFAFC' },
            '&:focus': { background: '#fff' },
          },
          '& .ol-attribution': {
            fontSize: 10,
            borderRadius: '6px 0 0 0',
            maxWidth: '78%',
            background: 'rgba(255,255,255,0.86)',
            '& a': { color: BRAND.inkSoft },
          },
          // Knock the stock OSM palette back toward the app's own.
          '& .pa-basemap': { filter: 'saturate(0.66) brightness(1.06) contrast(0.94)' },
        }}
      />

      {/* ---- Overlay: title and basemap switch ---- */}
      <Stack
        direction="row"
        sx={{
          position: 'absolute',
          top: 12,
          left: 12,
          right: 12,
          gap: 1,
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          pointerEvents: 'none',
        }}
      >
        <Paper
          sx={{
            px: { xs: 1.25, sm: 1.75 },
            py: { xs: 0.75, sm: 1.1 },
            borderRadius: `${RADIUS.md}px`,
            bgcolor: 'rgba(255,255,255,0.94)',
            border: `1px solid ${BRAND.line}`,
            pointerEvents: 'auto',
          }}
        >
          <Typography
            variant="overline"
            sx={{ color: 'primary.main', display: { xs: 'none', sm: 'block' }, lineHeight: 1.2 }}
          >
            Alberta
          </Typography>
          <Typography variant="subtitle2" sx={{ whiteSpace: 'nowrap' }}>
            {spots.length} {spots.length === 1 ? 'spot' : 'spots'}
          </Typography>
          {location ? (
            <Typography variant="caption" sx={{ color: '#2563EB', display: 'block', fontWeight: 700 }}>
              Blue dot is you
            </Typography>
          ) : null}
        </Paper>

        <Stack direction="row" sx={{ gap: 1, pointerEvents: 'auto' }}>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={basemap}
            onChange={(_, v) => v && setBasemap(v)}
            aria-label="Base map"
            sx={{
              bgcolor: 'background.paper',
              '& .MuiToggleButton-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: { xs: '0.7rem', sm: '0.78rem' },
                px: { xs: 1, sm: 1.5 },
                py: 0.6,
                whiteSpace: 'nowrap',
                borderColor: BRAND.line,
              },
            }}
          >
            <ToggleButton value="light">Map</ToggleButton>
            <ToggleButton value="street">Terrain</ToggleButton>
          </ToggleButtonGroup>

          <Tooltip
            title={
              status === 'denied'
                ? 'Location is blocked in the browser'
                : status === 'unavailable'
                  ? 'Location is not available'
                  : 'Show my location'
            }
          >
            <IconButton
              onClick={showMe}
              size="small"
              aria-label="Show my location"
              sx={{
                bgcolor: 'background.paper',
                color: '#2563EB',
                border: `1px solid ${BRAND.line}`,
                borderRadius: `${RADIUS.sm}px`,
                '&:hover': { bgcolor: '#FAFAFC' },
              }}
            >
              <MyLocationRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Reset to all of Alberta">
            <IconButton
              onClick={resetView}
              size="small"
              aria-label="Reset the map to all of Alberta"
              sx={{
                bgcolor: 'background.paper',
                border: `1px solid ${BRAND.line}`,
                borderRadius: `${RADIUS.sm}px`,
                '&:hover': { bgcolor: '#FAFAFC' },
              }}
            >
              <MyLocationRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* ---- Overlay: the selected spot ---- */}
      {selectedSpot ? (
        <Paper
          sx={{
            position: 'absolute',
            right: 12,
            bottom: 52,
            width: 'min(280px, calc(100% - 80px))',
            p: 2,
            borderRadius: `${RADIUS.md}px`,
            border: `1px solid ${BRAND.line}`,
            boxShadow: '0 12px 32px -14px rgba(18,18,20,.3)',
          }}
        >
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
            <Typography variant="h5">{selectedSpot.name}</Typography>
            <IconButton
              size="small"
              onClick={() => selectRef.current && selectRef.current(null)}
              aria-label="Close spot preview"
              sx={{ mt: -0.5, mr: -0.5 }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <PlaceRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {selectedSpot.city} · {selectedSpot.distanceKm} km
            </Typography>
          </Stack>

          <Stack direction="row" sx={{ alignItems: 'center', gap: 0.4, mt: 0.75 }}>
            <StarRoundedIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              {selectedSpot.rating}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              · {selectedSpot.artistCount} artists painting here
            </Typography>
          </Stack>

          <Button
            component={RouterLink}
            to={`/spots/${selectedSpot.id}`}
            size="small"
            variant="contained"
            fullWidth
            endIcon={<NorthEastRoundedIcon sx={{ fontSize: 14 }} />}
            sx={{ mt: 1.5 }}
          >
            Explore this spot
          </Button>
        </Paper>
      ) : null}
      </Box>

      {/* ---- The same list the pins represent ---- */}
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box sx={{ px: 2.25, py: 1.75, borderBottom: `1px solid ${BRAND.line}` }}>
          <Typography variant="h5">Spots on the map</Typography>
          <Typography variant="caption" color="text.secondary">
            Select one to zoom in on the map
          </Typography>
          {/* Plain text, not chips: chips here sat right under the real
              region filters and read as a second, broken set of them. */}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
            {regionCounts.map(([region, count]) => `${region} ${count}`).join('  ·  ')}
          </Typography>
        </Box>

        <Box sx={{ overflowY: 'auto', maxHeight: { md: 476 }, flex: 1 }}>
          {spots.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2.25 }}>
              No spots match the current filter.
            </Typography>
          ) : (
            spots.map((spot) => {
              const active = spot.id === activeSpotId;
              const selected = selectedSpot && selectedSpot.id === spot.id;
              return (
                <Box
                  key={spot.id}
                  component="button"
                  type="button"
                  onMouseEnter={() => hoverRef.current && hoverRef.current(spot.id)}
                  onMouseLeave={() => hoverRef.current && hoverRef.current(null)}
                  onFocus={() => hoverRef.current && hoverRef.current(spot.id)}
                  onBlur={() => hoverRef.current && hoverRef.current(null)}
                  onClick={() => selectRef.current && selectRef.current(spot.id)}
                  aria-pressed={Boolean(selected)}
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'center',
                    width: '100%',
                    textAlign: 'left',
                    font: 'inherit',
                    cursor: 'pointer',
                    border: 0,
                    borderBottom: `1px solid ${BRAND.line}`,
                    px: 2.25,
                    py: 1.5,
                    bgcolor: selected ? BRAND.magentaSoft : active ? '#FAFAFC' : 'transparent',
                    transition: 'background-color .15s ease',
                  }}
                >
                  <SceneImage
                    variant={spot.scene}
                    slug={spot.slug}
                    sx={{ width: 52, height: 42, flexShrink: 0 }}
                    radius={RADIUS.sm}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap>
                      {spot.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                      {spot.region} · {spot.distanceKm} km away
                    </Typography>
                  </Box>
                  <Stack direction="row" sx={{ alignItems: 'center', gap: 0.3, flexShrink: 0 }}>
                    <StarRoundedIcon sx={{ fontSize: 15, color: 'primary.main' }} />
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      {spot.rating}
                    </Typography>
                  </Stack>
                </Box>
              );
            })
          )}
        </Box>
      </Box>
    </Paper>
  );
}
