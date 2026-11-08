import { useRef } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import SceneImage from '@/components/common/SceneImage';
import { RADIUS } from '@/theme';

/**
 * The illustrated half of the auth card.
 *
 * The artwork drifts very slightly with the pointer. It is a small amount
 * of life on an otherwise static page, and it is done on a spring driven by
 * a motion value rather than React state, so moving the mouse across the
 * card can never interrupt typing in the form beside it. Honoured
 * `prefers-reduced-motion` disables it outright.
 */
export default function AuthArtPanel({ scene, caption, headline, subhead, place }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 120, damping: 24, mass: 0.6 };
  const x = useSpring(mx, spring);
  const y = useSpring(my, spring);
  // Derived unconditionally — hooks cannot live inside the render branch
  // that decides whether reduced motion applies.
  const driftX = useTransform(x, [-1, 1], [-14, 14]);
  const driftY = useTransform(y, [-1, 1], [-10, 10]);

  const onMove = (event) => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mx.set(((event.clientX - rect.left) / rect.width) * 2 - 1);
    my.set(((event.clientY - rect.top) / rect.height) * 2 - 1);
  };

  const reset = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <Box
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: { xs: 340, sm: 380, md: 'auto' },
        bgcolor: '#CBD6E2',
      }}
    >
      <Box
        component={motion.div}
        style={reduced ? undefined : { x: driftX, y: driftY }}
        sx={{ position: 'absolute', inset: -20 }}
      >
        <SceneImage variant={scene} sx={{ width: '100%', height: '100%' }} />
      </Box>

      <Chip
        icon={<PlaceRoundedIcon sx={{ fontSize: 16, color: 'primary.main !important' }} />}
        label={caption}
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          bgcolor: 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(6px)',
          fontSize: '0.78rem',
          height: 32,
          px: 0.5,
        }}
      />

      <Paper
        sx={{
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: 20,
          p: { xs: 2.25, md: 3 },
          borderRadius: `${RADIUS.lg}px`,
          bgcolor: 'rgba(255,255,255,0.93)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Typography variant="h3" sx={{ lineHeight: 1.18 }}>
          {headline}
          <br />
          {subhead}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1.25, maxWidth: '34ch', display: { xs: 'none', sm: 'block' } }}
        >
          Find a place to pause, make something, and meet your kind of people.
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1.75 }}>
          <PlaceRoundedIcon sx={{ fontSize: 17, color: 'primary.main' }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {place}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
