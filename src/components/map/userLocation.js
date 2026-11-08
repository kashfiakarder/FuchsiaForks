import { useCallback, useEffect, useState } from 'react';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { fromLonLat } from 'ol/proj';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';

/** Soft ring plus a solid blue centre, so "you" reads against the magenta pins. */
export const USER_LOCATION_STYLE = [
  new Style({
    image: new CircleStyle({
      radius: 18,
      fill: new Fill({ color: 'rgba(37, 99, 235, 0.24)' }),
      stroke: new Stroke({ color: 'rgba(37, 99, 235, 0.75)', width: 2 }),
    }),
    zIndex: 30,
  }),
  new Style({
    image: new CircleStyle({
      radius: 7,
      fill: new Fill({ color: '#2563EB' }),
      stroke: new Stroke({ color: '#FFFFFF', width: 3 }),
    }),
    zIndex: 31,
  }),
];

export function createUserLocationLayer() {
  const source = new VectorSource();
  const layer = new VectorLayer({ source, style: USER_LOCATION_STYLE, zIndex: 30 });
  return { source, layer };
}

export function setUserLocationFeature(source, location) {
  if (!source) return;
  source.clear();
  if (!location?.lonLat) return;
  source.addFeature(
    new Feature({
      geometry: new Point(fromLonLat(location.lonLat)),
      kind: 'user',
    }),
  );
}

/** Browser geolocation. Prompts once, then keeps the fix fresh while the map is open. */
export function useUserLocation() {
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState('idle');

  const apply = useCallback((position) => {
    setLocation({
      lonLat: [position.coords.longitude, position.coords.latitude],
      accuracy: position.coords.accuracy,
    });
    setStatus('ready');
  }, []);

  const request = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unavailable');
      return;
    }
    setStatus((current) => (current === 'ready' ? current : 'pending'));
    navigator.geolocation.getCurrentPosition(apply, () => {
      setStatus((current) => (current === 'ready' ? current : 'denied'));
    }, { enableHighAccuracy: true, maximumAge: 10000, timeout: 12000 });
  }, [apply]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unavailable');
      return undefined;
    }
    const id = navigator.geolocation.watchPosition(apply, () => {
      setStatus((current) => (current === 'ready' ? current : 'denied'));
    }, { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 });
    return () => navigator.geolocation.clearWatch(id);
  }, [apply]);

  return { location, status, request };
}
