import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import MyLocationRoundedIcon from '@mui/icons-material/MyLocationRounded';

import OlMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import { fromLonLat } from 'ol/proj';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import { defaults as defaultControls } from 'ol/control';
import { unByKey } from 'ol/Observable';
import 'ol/ol.css';

import { ALBERTA_OUTLINE } from '@/data/alberta';
import { createUserLocationLayer, setUserLocationFeature, useUserLocation } from '@/components/map/userLocation';
import { BRAND, RADIUS } from '@/theme';

const FIT_PADDING = [64, 64, 80, 64];

const provinceStyle = new Style({
  fill: new Fill({ color: 'rgba(236, 239, 234, 0.35)' }),
  stroke: new Stroke({ color: BRAND.magenta, width: 1.6 }),
});

const maskStyle = new Style({ fill: new Fill({ color: 'rgba(248, 248, 250, 0.68)' }) });

const WORLD_RING = [
  [-179.9, -85],
  [179.9, -85],
  [179.9, 85],
  [-179.9, 85],
  [-179.9, -85],
];

const LINE_STYLE = [
  new Style({
    stroke: new Stroke({ color: '#FFFFFF', width: 10, lineCap: 'round', lineJoin: 'round' }),
    zIndex: 1,
  }),
  new Style({
    stroke: new Stroke({ color: BRAND.magenta, width: 5, lineCap: 'round', lineJoin: 'round' }),
    zIndex: 2,
  }),
];

function fitExtent(map, extent, maxZoom) {
  const size = map.getSize();
  if (!extent || !size || size[0] < 20 || size[1] < 20) return false;
  const incomplete = extent.some((value) => !Number.isFinite(value));
  if (incomplete) return false;
  map.getView().fit(extent, {
    padding: FIT_PADDING,
    maxZoom,
    duration: 450,
  });
  return true;
}

const STOP_STYLES = new Map();

function stopStyle(order) {
  const label = String(order);
  let style = STOP_STYLES.get(label);
  if (style) return style;
  style = new Style({
    image: new CircleStyle({
      radius: 13,
      fill: new Fill({ color: BRAND.magentaDark }),
      stroke: new Stroke({ color: '#FFFFFF', width: 2.5 }),
    }),
    text: new Text({
      text: label,
      fill: new Fill({ color: '#FFFFFF' }),
      font: '700 12px Inter, system-ui, sans-serif',
      textAlign: 'center',
      textBaseline: 'middle',
    }),
    zIndex: 2,
  });
  STOP_STYLES.set(label, style);
  return style;
}

/**
 * The same Alberta basemap as Discover, drawn for one ordered path.
 * `stops` are spots in visit order. One stop is a pin; two or more are a line.
 */
export default function RouteMap({ stops, label }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const provinceExtentRef = useRef(null);
  const routeSourceRef = useRef(null);
  const osmLayerRef = useRef(null);
  const lightLayerRef = useRef(null);
  const userSourceRef = useRef(null);
  const [basemap, setBasemap] = useState('light');
  const { location, status, request } = useUserLocation();
  const locationRef = useRef(location);
  locationRef.current = location;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const albertaRing = ALBERTA_OUTLINE.map((c) => fromLonLat(c));
    const provinceGeometry = new Polygon([albertaRing]);
    provinceExtentRef.current = provinceGeometry.getExtent();
    const maskGeometry = new Polygon([WORLD_RING.map((c) => fromLonLat(c)), [...albertaRing].reverse()]);

    const mask = new VectorLayer({
      source: new VectorSource({ features: [new Feature(maskGeometry)] }),
      style: maskStyle,
    });
    const province = new VectorLayer({
      source: new VectorSource({ features: [new Feature(provinceGeometry)] }),
      style: provinceStyle,
    });

    const routeSource = new VectorSource();
    const routeLayer = new VectorLayer({
      source: routeSource,
      zIndex: 10,
      style: (feature) => (feature.get('kind') === 'line' ? LINE_STYLE : stopStyle(feature.get('order'))),
    });
    const { source: userSource, layer: userLayer } = createUserLocationLayer();

    const light = new TileLayer({ source: new OSM(), className: 'ol-layer pa-basemap' });
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
      layers: [light, osm, mask, province, routeLayer, userLayer],
      view: new View({ center: fromLonLat([-114.6, 54.6]), zoom: 5, minZoom: 4, maxZoom: 14 }),
      controls: defaultControls({ rotate: false, attributionOptions: { collapsible: false } }),
    });

    map.getView().fit(provinceExtentRef.current, { padding: FIT_PADDING });

    mapRef.current = map;
    routeSourceRef.current = routeSource;
    userSourceRef.current = userSource;
    osmLayerRef.current = osm;
    lightLayerRef.current = light;
    setUserLocationFeature(userSource, locationRef.current);

    return () => {
      map.setTarget(undefined);
      map.dispose();
      mapRef.current = null;
      routeSourceRef.current = null;
      userSourceRef.current = null;
    };
  }, []);

  useEffect(() => {
    setUserLocationFeature(userSourceRef.current, location);
  }, [location]);

  useEffect(() => {
    const source = routeSourceRef.current;
    const map = mapRef.current;
    if (!source || !map) return;

    source.clear();
    const coordinates = [];
    stops.forEach((stop, index) => {
      if (!stop?.lonLat) return;
      const coordinate = fromLonLat(stop.lonLat);
      coordinates.push(coordinate);
      source.addFeature(
        new Feature({
          geometry: new Point(coordinate),
          order: index + 1,
          kind: 'stop',
        }),
      );
    });
    if (coordinates.length >= 2) {
      source.addFeature(
        new Feature({
          geometry: new LineString(coordinates),
          kind: 'line',
        }),
      );
    }

    map.updateSize();
    const extent = coordinates.length ? source.getExtent() : provinceExtentRef.current;
    const maxZoom = coordinates.length === 1 ? 11 : 13;
    let listener;
    const apply = () => {
      if (!fitExtent(map, extent, coordinates.length ? maxZoom : undefined)) return;
      if (listener) {
        unByKey(listener);
        listener = undefined;
      }
    };
    if (!fitExtent(map, extent, coordinates.length ? maxZoom : undefined)) {
      listener = map.on('change:size', apply);
    }
    return () => {
      if (listener) unByKey(listener);
    };
  }, [stops]);

  useEffect(() => {
    if (osmLayerRef.current) osmLayerRef.current.setVisible(basemap === 'street');
    if (lightLayerRef.current) lightLayerRef.current.setVisible(basemap === 'light');
  }, [basemap]);

  const showMe = () => {
    request();
    const current = locationRef.current;
    const map = mapRef.current;
    if (!current || !map) return;
    const view = map.getView();
    view.animate({
      center: fromLonLat(current.lonLat),
      zoom: Math.max(view.getZoom() ?? 5, 12),
      duration: 520,
    });
  };

  const resetView = () => {
    const map = mapRef.current;
    const source = routeSourceRef.current;
    if (!map) return;
    const extent = source && source.getFeatures().length ? source.getExtent() : provinceExtentRef.current;
    if (!extent) return;
    map.getView().fit(extent, { padding: FIT_PADDING, maxZoom: 12, duration: 450 });
  };

  const countLabel = stops.length === 1 ? '1 stop' : `${stops.length} stops`;

  return (
    <Paper sx={{ overflow: 'hidden', border: `1px solid ${BRAND.line}`, borderRadius: `${RADIUS.lg}px` }}>
      <Box
        sx={{
          position: 'relative',
          minHeight: { xs: 360, sm: 480, lg: 640 },
          bgcolor: '#F0F1F4',
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
          '& .pa-basemap': { filter: 'saturate(0.66) brightness(1.06) contrast(0.94)' },
        }}
      >
        <Box ref={containerRef} sx={{ height: { xs: 360, sm: 480, lg: 640 } }} />

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
              px: 1.75,
              py: 1.1,
              borderRadius: `${RADIUS.md}px`,
              bgcolor: 'rgba(255,255,255,0.94)',
              border: `1px solid ${BRAND.line}`,
              pointerEvents: 'auto',
              maxWidth: 'min(280px, calc(100% - 150px))',
            }}
          >
            <Typography variant="overline" sx={{ color: 'primary.main', lineHeight: 1.2 }}>
              Route
            </Typography>
            <Typography variant="subtitle2" noWrap>
              {label || 'Alberta'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {countLabel}
            </Typography>
          </Paper>

          <Stack direction="row" sx={{ gap: 1, pointerEvents: 'auto' }}>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={basemap}
              onChange={(_, value) => value && setBasemap(value)}
              aria-label="Base map"
              sx={{
                bgcolor: 'background.paper',
                '& .MuiToggleButton-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  px: 1.5,
                  py: 0.6,
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
            <Tooltip title="Fit the route">
              <IconButton
                onClick={resetView}
                size="small"
                aria-label="Fit the map to this route"
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
      </Box>
    </Paper>
  );
}
