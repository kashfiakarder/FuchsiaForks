import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import { Link as RouterLink } from 'react-router-dom';

import SceneImage from '@/components/common/SceneImage';
import { useAppState } from '@/state/AppState';
import { BRAND, cardSx } from '@/theme';

/**
 * A painting spot, as it appears in the Discover grid.
 *
 * `active` mirrors the hover state of its pin on the map, so pointing at
 * either one lights up the other.
 */
export default function SpotCard({ spot, active = false }) {
  const { eventsAtSpot } = useAppState();
  const upcoming = eventsAtSpot(spot.id).length;

  return (
    <Paper
      component="article"
      sx={{
        ...cardSx,
        overflow: 'hidden',
        height: '100%',
        transition: 'border-color .18s ease, box-shadow .18s ease, transform .18s ease',
        ...(active
          ? {
              borderColor: BRAND.magentaBorder,
              boxShadow: '0 10px 26px -14px rgba(18,18,20,.26)',
              transform: 'translateY(-2px)',
            }
          : null),
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <SceneImage variant={spot.scene} height={168} />
        <Chip
          label={spot.tagline}
          size="small"
          sx={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            bgcolor: 'rgba(255,255,255,0.94)',
            fontSize: '0.72rem',
          }}
        />
      </Box>

      <Box sx={{ p: 2.25 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
          <Typography variant="h4" component="h3">
            <Link
              component={RouterLink}
              to={`/spots/${spot.id}`}
              underline="none"
              color="text.primary"
              sx={{ '&:hover': { color: 'primary.main' } }}
            >
              {spot.name}
            </Link>
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, flexShrink: 0, mt: 0.2 }}>
            <StarRoundedIcon sx={{ fontSize: 17, color: 'primary.main' }} />
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {spot.rating}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.75 }}>
          <PlaceOutlinedIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">
            {spot.address} · {spot.distanceKm} km away
          </Typography>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.25 }}>
          {spot.region} · {spot.artistCount} artists painting here
          {upcoming ? ` · ${upcoming} upcoming ${upcoming === 1 ? 'event' : 'events'}` : ''}
        </Typography>
      </Box>
    </Paper>
  );
}
