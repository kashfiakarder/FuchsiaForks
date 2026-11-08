import { useId, useMemo } from 'react';
import Box from '@mui/material/Box';

/**
 * Procedurally drawn landscape illustrations.
 *
 * Every photograph in this app is one of these. That is a deliberate
 * constraint: no stock licences, no external image host to go down, and the
 * whole library weighs a few kilobytes of markup instead of megabytes of
 * JPEG. Ridgelines are generated from seeded noise, so each spot gets its
 * own skyline and the same spot looks identical on every reload.
 *
 * Pass `title` when the image carries meaning; leave it off and the SVG is
 * marked decorative, because a card that already names the spot in text
 * does not need the picture announced as well.
 */

/* ------------------------------------------------------------------ *
 *  Seeded noise
 * ------------------------------------------------------------------ */

function hash(n) {
  const s = Math.sin(n * 127.1) * 43758.5453123;
  return s - Math.floor(s);
}

function valueNoise(x) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash(i) * (1 - u) + hash(i + 1) * u;
}

/**
 * Ridged multifractal: folding each octave about its midpoint and squaring
 * it gives sharp summits and smooth valleys. A plain fbm gives rolling
 * dunes, which never reads as mountains.
 */
function ridged(x, seed, octaves = 4) {
  let value = 0;
  let amp = 0.5;
  let freq = 1;
  let total = 0;
  for (let o = 0; o < octaves; o += 1) {
    const n = valueNoise(x * freq + seed);
    const folded = 1 - Math.abs(2 * n - 1);
    value += amp * folded * folded;
    total += amp;
    freq *= 2.07;
    amp *= 0.52;
  }
  return value / total;
}

const W = 1000;
const H = 700;

/** A closed path running along a ridgeline and down to the bottom edge. */
function ridgePath(seed, baseline, amplitude, frequency, samples = 110) {
  const points = [];
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const h = ridged(t * frequency, seed) * 0.8 + valueNoise(t * frequency * 0.3 + seed) * 0.3;
    points.push(h);
    if (h < min) min = h;
    if (h > max) max = h;
  }
  const span = Math.max(max - min, 1e-4);

  let d = '';
  for (let i = 0; i <= samples; i += 1) {
    const x = (i / samples) * W;
    const y = baseline - ((points[i] - min) / span) * amplitude;
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${d}L${W} ${H}L0 ${H}Z`;
}

/* ------------------------------------------------------------------ *
 *  Variants
 * ------------------------------------------------------------------ */

const VARIANTS = {
  creek: {
    sky: ['#C7D8EA', '#E7DEE8', '#FBEEDC'],
    sun: { x: 0.68, y: 0.22, r: 46, color: '#FFE6B4' },
    ranges: [
      { seed: 11, baseline: 350, amp: 72, freq: 3, fill: '#B9C6D6', haze: 0.55 },
      { seed: 27, baseline: 400, amp: 96, freq: 4, fill: '#93A68F', haze: 0.3 },
      { seed: 44, baseline: 455, amp: 118, freq: 5, fill: '#6E8468', haze: 0.12 },
    ],
    water: { top: 470, color: '#B9C9CE', shoreColor: '#5C7355' },
    trees: { count: 16, baseline: 468, color: '#4C6247' },
  },
  reservoir: {
    sky: ['#BBD2EA', '#DCDFEA', '#F7E9D8'],
    sun: { x: 0.26, y: 0.2, r: 40, color: '#FFE2AC' },
    ranges: [
      { seed: 61, baseline: 300, amp: 110, freq: 2.2, fill: '#A9BACF', haze: 0.6 },
      { seed: 83, baseline: 350, amp: 128, freq: 3, fill: '#8396AE', haze: 0.35 },
      { seed: 97, baseline: 396, amp: 84, freq: 4.2, fill: '#66798E', haze: 0.14 },
    ],
    water: { top: 400, color: '#9FB6C8', shoreColor: '#5B6E7E' },
    trees: { count: 9, baseline: 400, color: '#4F6356' },
  },
  skyline: {
    sky: ['#9FB6D8', '#E4CFD6', '#FBD9B4'],
    sun: { x: 0.5, y: 0.3, r: 52, color: '#FFD59A' },
    ranges: [{ seed: 31, baseline: 330, amp: 54, freq: 2, fill: '#A8B6CC', haze: 0.55 }],
    city: true,
    water: { top: 520, color: '#A7B3C6', shoreColor: '#5A6072' },
  },
  meadow: {
    sky: ['#CBDDEC', '#E9E3E6', '#FBF0DC'],
    sun: { x: 0.74, y: 0.24, r: 42, color: '#FFE9BE' },
    ranges: [
      { seed: 19, baseline: 340, amp: 58, freq: 2.4, fill: '#BDC8D4', haze: 0.55 },
      { seed: 37, baseline: 400, amp: 70, freq: 3.4, fill: '#9FAE8D', haze: 0.26 },
      { seed: 53, baseline: 470, amp: 56, freq: 4.6, fill: '#7E9165', haze: 0.08 },
    ],
    water: { top: 540, color: '#A7B98F', shoreColor: '#6A7D4E' },
    trees: { count: 11, baseline: 486, color: '#56683F' },
  },
  prairie: {
    sky: ['#B6CFEA', '#DEE2EA', '#F9EEDA'],
    sun: { x: 0.2, y: 0.22, r: 44, color: '#FFE4B0' },
    ranges: [
      { seed: 71, baseline: 380, amp: 40, freq: 1.8, fill: '#C2CBD8', haze: 0.6 },
      { seed: 89, baseline: 440, amp: 46, freq: 2.6, fill: '#B3B289', haze: 0.22 },
    ],
    water: { top: 480, color: '#C0BC86', shoreColor: '#8E8A56' },
  },
  woods: {
    sky: ['#CFDCE4', '#E4E3DC', '#F4EEDC'],
    sun: { x: 0.44, y: 0.16, r: 34, color: '#FFF0CE' },
    ranges: [
      { seed: 23, baseline: 320, amp: 64, freq: 3.2, fill: '#A9B6A6', haze: 0.5 },
      { seed: 41, baseline: 390, amp: 80, freq: 4.4, fill: '#7C8E72', haze: 0.22 },
    ],
    water: { top: 470, color: '#8E9A74', shoreColor: '#5E6B4A' },
    trees: { count: 22, baseline: 470, color: '#3F5138', tall: true },
  },
  rockies: {
    sky: ['#AFCBE8', '#D8DEEA', '#F6EADA'],
    sun: { x: 0.74, y: 0.18, r: 38, color: '#FFE9BE' },
    ranges: [
      { seed: 101, baseline: 258, amp: 158, freq: 2.4, fill: '#9FB0C8', haze: 0.52 },
      { seed: 117, baseline: 318, amp: 176, freq: 3.1, fill: '#7B8CA6', haze: 0.3 },
      { seed: 133, baseline: 372, amp: 150, freq: 4.0, fill: '#5C6E86', haze: 0.12 },
    ],
    // Snow on the high ground is what separates the Rockies from any other
    // range in the set.
    snowline: { below: 58, color: '#F7F9FC' },
    water: { top: 430, color: '#7FB7C4', shoreColor: '#4C6A6E' },
    trees: { count: 18, baseline: 432, color: '#39513F', tall: true },
  },
  badlands: {
    sky: ['#BBD2E6', '#E6DCD2', '#F8E7CE'],
    sun: { x: 0.3, y: 0.2, r: 42, color: '#FFE0A6' },
    ranges: [
      { seed: 151, baseline: 352, amp: 60, freq: 2.2, fill: '#C7B49A', haze: 0.5 },
      { seed: 167, baseline: 414, amp: 96, freq: 4.4, fill: '#B2947A', haze: 0.24 },
      { seed: 181, baseline: 486, amp: 108, freq: 6.0, fill: '#96755D', haze: 0.08 },
    ],
    // Horizontal sediment bands are the whole character of the badlands.
    strata: { top: 470, color: '#7E6049' },
    water: { top: 600, color: '#A89272', shoreColor: '#6E5742' },
  },
  paintout: {
    sky: ['#C5D8E8', '#E8DFE4', '#FBEDD8'],
    sun: { x: 0.72, y: 0.2, r: 44, color: '#FFE5B2' },
    ranges: [
      { seed: 13, baseline: 330, amp: 70, freq: 2.8, fill: '#B5C3D2', haze: 0.55 },
      { seed: 29, baseline: 392, amp: 92, freq: 3.8, fill: '#8EA288', haze: 0.28 },
      { seed: 47, baseline: 450, amp: 104, freq: 4.8, fill: '#6A8061', haze: 0.1 },
    ],
    water: { top: 452, color: '#B5C6CB', shoreColor: '#586F52' },
    trees: { count: 13, baseline: 450, color: '#485D43' },
    bank: { top: 568, color: '#7E8F63' },
    painters: true,
  },
};

/** An abstract close-up, for gallery tiles that are not a view. */
function PaletteArt({ gradId }) {
  const blobs = [
    { cx: 300, cy: 260, rx: 92, ry: 70, fill: '#C84A3C' },
    { cx: 470, cy: 215, rx: 78, ry: 58, fill: '#E0A33C' },
    { cx: 640, cy: 262, rx: 86, ry: 64, fill: '#4D7A52' },
    { cx: 380, cy: 420, rx: 96, ry: 66, fill: '#3C5C86' },
    { cx: 600, cy: 430, rx: 84, ry: 62, fill: '#8A4A74' },
  ];
  return (
    <>
      <rect width={W} height={H} fill={`url(#${gradId})`} />
      <g opacity="0.92">
        {blobs.map((b) => (
          <ellipse key={`${b.cx}-${b.cy}`} {...b} />
        ))}
      </g>
      {/* A loaded brush resting across the board. */}
      <g transform="rotate(-18 500 560)">
        <rect x="250" y="548" width="420" height="16" rx="8" fill="#8A6A48" />
        <rect x="650" y="542" width="58" height="28" rx="6" fill="#B9B2A4" />
        <path d="M708 546 q46 10 0 20 z" fill="#C84A3C" />
      </g>
    </>
  );
}

export default function SceneImage({
  variant = 'creek',
  title,
  ratio,
  height,
  radius = 0,
  sx,
  ...rest
}) {
  const uid = useId().replace(/[:]/g, '');
  const config = VARIANTS[variant];

  const paths = useMemo(() => {
    if (!config) return [];
    return config.ranges.map((r) => ({
      ...r,
      d: ridgePath(r.seed, r.baseline, r.amp, r.freq),
    }));
  }, [config]);

  const trees = useMemo(() => {
    if (!config?.trees) return [];
    const { count, baseline, tall } = config.trees;
    return Array.from({ length: count }, (_, i) => {
      const r1 = hash(i * 3.7 + 1);
      const r2 = hash(i * 9.1 + 2);
      const h = (tall ? 86 : 42) + r2 * (tall ? 104 : 46);
      return {
        x: ((i + 0.5) / count) * W + (r1 - 0.5) * 48,
        y: baseline + (r2 - 0.5) * 16,
        w: h * (tall ? 0.34 : 0.46),
        h,
      };
    });
  }, [config]);

  const skyId = `sky-${uid}`;
  const grainId = `grain-${uid}`;

  const labelled = Boolean(title);

  const svg =
    variant === 'palette' ? (
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
        <defs>
          <linearGradient id={skyId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#D9CDBB" />
            <stop offset="100%" stopColor="#B59C80" />
          </linearGradient>
        </defs>
        <PaletteArt gradId={skyId} />
      </svg>
    ) : (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        width="100%"
        height="100%"
        role={labelled ? 'img' : 'presentation'}
        aria-label={labelled ? title : undefined}
        aria-hidden={labelled ? undefined : 'true'}
      >
        <defs>
          <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={config.sky[0]} />
            <stop offset="52%" stopColor={config.sky[1]} />
            <stop offset="100%" stopColor={config.sky[2]} />
          </linearGradient>
          <radialGradient id={`sun-${uid}`}>
            <stop offset="0%" stopColor={config.sun.color} stopOpacity="0.95" />
            <stop offset="55%" stopColor={config.sun.color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={config.sun.color} stopOpacity="0" />
          </radialGradient>
          {/* A little tooth over the whole thing: without it the flat fills
              read as vector art rather than as something painted. */}
          <filter id={grainId}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>

        {labelled && <title>{title}</title>}

        <rect width={W} height={H} fill={`url(#${skyId})`} />
        <circle
          cx={config.sun.x * W}
          cy={config.sun.y * H}
          r={config.sun.r * 4.6}
          fill={`url(#sun-${uid})`}
        />
        <circle cx={config.sun.x * W} cy={config.sun.y * H} r={config.sun.r} fill={config.sun.color} />

        {paths.map((r) => (
          <g key={r.seed}>
            <path d={r.d} fill={r.fill} />
            {/* Atmospheric perspective: wash each range toward the horizon
                colour by how far away it is. */}
            <path d={r.d} fill={config.sky[2]} opacity={r.haze} />
          </g>
        ))}

        {config.snowline &&
          paths.map((r) => (
            <path
              key={`snow-${r.seed}`}
              d={r.d}
              fill={config.snowline.color}
              opacity={0.85 - r.haze * 0.7}
              style={{ clipPath: `inset(0 0 ${H - (r.baseline - r.amp + config.snowline.below)}px 0)` }}
            />
          ))}

        {config.strata && (
          <g opacity="0.5">
            {Array.from({ length: 7 }, (_, i) => (
              <rect
                key={i}
                x="0"
                y={config.strata.top + i * 18}
                width={W}
                height={7}
                fill={config.strata.color}
                opacity={0.42 - i * 0.04}
              />
            ))}
          </g>
        )}

        {config.city && (
          <g>
            {[
              [340, 250, 44, 290], [392, 196, 36, 344], [434, 232, 52, 308],
              [492, 150, 42, 390], [540, 214, 34, 326], [580, 182, 48, 358],
              [634, 246, 38, 294], [678, 212, 44, 328], [728, 262, 36, 278],
            ].map(([x, y, w, h]) => (
              <rect key={x} x={x} y={y} width={w} height={h} fill="#6C7589" opacity="0.92" rx="2" />
            ))}
            <rect x="500" y="96" width="10" height="60" fill="#6C7589" />
          </g>
        )}

        {config.water && (
          <g>
            <rect x="0" y={config.water.top} width={W} height={H - config.water.top} fill={config.water.color} />
            {/* Broken horizontal strokes read as reflection without having
                to actually mirror anything. */}
            {Array.from({ length: 14 }, (_, i) => {
              const y = config.water.top + 18 + i * 16;
              const w = 120 + hash(i * 5.3) * 420;
              const x = hash(i * 2.9) * (W - w);
              return (
                <rect
                  key={y}
                  x={x}
                  y={y}
                  width={w}
                  height={3}
                  rx={1.5}
                  fill="#FFFFFF"
                  opacity={0.22 - i * 0.01}
                />
              );
            })}
            <rect x="0" y={config.water.top - 6} width={W} height="10" fill={config.water.shoreColor} opacity="0.5" />
          </g>
        )}

        {config.bank && (
          <path
            d={`M0 ${config.bank.top + 18} Q250 ${config.bank.top - 10} 520 ${config.bank.top + 6} T1000 ${config.bank.top - 4} L1000 ${H} L0 ${H} Z`}
            fill={config.bank.color}
          />
        )}

        {trees.map((t) => (
          <path
            key={`${t.x}-${t.y}`}
            d={`M${t.x} ${t.y - t.h} Q${t.x + t.w} ${t.y - t.h * 0.3} ${t.x + t.w * 0.55} ${t.y} L${t.x - t.w * 0.55} ${t.y} Q${t.x - t.w} ${t.y - t.h * 0.3} ${t.x} ${t.y - t.h}Z`}
            fill={config.trees.color}
            opacity="0.95"
          />
        ))}

        {config.painters && (
          <g>
            {[170, 395, 605, 820].map((x, i) => {
              const y = 646 + (i % 2) * 20;
              const flip = i % 2 === 0 ? 1 : -1;
              return (
                <g key={x} transform={`translate(${x} ${y})`}>
                  {/* Easel */}
                  <g stroke="#6B5236" strokeWidth="5" strokeLinecap="round" fill="none">
                    <path d={`M${-18 * flip} 0 L0 -82`} />
                    <path d={`M${18 * flip} 0 L0 -82`} />
                    <path d="M0 -82 L0 -16" />
                  </g>
                  <rect x={-28} y={-116} width={56} height={44} rx="2" fill="#F3EDE0" stroke="#C9BDA6" strokeWidth="3" />
                  {/* Painter */}
                  <g transform={`translate(${46 * flip} 0)`}>
                    <circle cx="0" cy="-104" r="13" fill="#44413E" />
                    <path d="M-15 -92 q15 -10 30 0 l6 56 q-21 7 -42 0 Z" fill="#3E4F63" />
                    <path d="M-9 -36 l-4 36 M9 -36 l4 36" stroke="#2F3A46" strokeWidth="9" strokeLinecap="round" />
                  </g>
                </g>
              );
            })}
          </g>
        )}

        <rect width={W} height={H} filter={`url(#${grainId})`} opacity="0.055" />
      </svg>
    );

  return (
    <Box
      {...rest}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: `${radius}px`,
        bgcolor: '#D9DEE6',
        lineHeight: 0,
        ...(height ? { height } : null),
        ...(ratio ? { aspectRatio: ratio } : null),
        '& svg': { display: 'block', width: '100%', height: '100%' },
        ...sx,
      }}
    >
      {svg}
    </Box>
  );
}

export const SCENE_VARIANTS = Object.keys(VARIANTS);
