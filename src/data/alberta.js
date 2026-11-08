/**
 * Geography for the Discover map.
 *
 * The province outline is a hand-simplified polygon, not survey data. Three
 * of Alberta's four borders really are straight lines — 49°N in the south,
 * 60°N in the north, 110°W in the east — and the fourth follows the
 * Continental Divide up to the 120th meridian at roughly 54°N. That makes a
 * recognisable Alberta out of about thirty coordinates, with no shapefile to
 * download and nothing to fetch at runtime.
 *
 * Coordinates are [longitude, latitude] in WGS 84, which is what
 * `fromLonLat` expects.
 */

export const ALBERTA_OUTLINE = [
  // South-west corner, then north along the Continental Divide.
  [-114.055, 49.0],
  [-114.33, 49.55],
  [-114.62, 50.05],
  [-114.95, 50.48],
  [-115.28, 50.92],
  [-115.52, 51.18],
  [-115.92, 51.56],
  [-116.28, 51.93],
  [-116.72, 52.24],
  [-117.08, 52.5],
  [-117.42, 52.78],
  [-117.78, 53.04],
  [-118.26, 53.36],
  [-118.72, 53.68],
  [-119.18, 53.92],
  [-119.72, 54.02],
  [-120.0, 54.04],
  // The 120th meridian north to the territorial boundary.
  [-120.0, 60.0],
  // 60°N east to the Saskatchewan border.
  [-110.0, 60.0],
  // The 110th meridian south to the international boundary.
  [-110.0, 49.0],
  [-114.055, 49.0],
];

/** Context labels, so the province reads as a place rather than a shape. */
export const ALBERTA_CITIES = [
  { name: 'Calgary', lonLat: [-114.0719, 51.0447], major: true },
  { name: 'Edmonton', lonLat: [-113.4909, 53.5461], major: true },
  { name: 'Red Deer', lonLat: [-113.8112, 52.2681] },
  { name: 'Lethbridge', lonLat: [-112.8451, 49.6956] },
  { name: 'Medicine Hat', lonLat: [-110.6765, 50.0405] },
  { name: 'Fort McMurray', lonLat: [-111.379, 56.7268] },
  { name: 'Grande Prairie', lonLat: [-118.7947, 55.1707] },
  { name: 'Jasper', lonLat: [-118.0814, 52.8737] },
  { name: 'Banff', lonLat: [-115.5708, 51.1784] },
];

/** The view the map opens on: the whole province, comfortably framed. */
export const ALBERTA_CENTER = [-114.6, 54.6];
export const ALBERTA_ZOOM = 5.1;
