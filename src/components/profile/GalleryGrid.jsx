import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import BrushRoundedIcon from '@mui/icons-material/BrushRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';

import GalleryImage from '@/components/profile/GalleryImage';
import { useAppState } from '@/state/AppState';
import { BRAND, RADIUS, cardSx } from '@/theme';

/**
 * One gallery tile.
 *
 * Artwork sits inside a mat and frame; a moment is a plain photo with a
 * camera chip. Making the two read differently at a glance matters,
 * because the same illustration engine draws both.
 */
function GalleryTile({ post, onOpen }) {
  const { getSpot } = useAppState();
  const spot = post.spotId ? getSpot(post.spotId) : null;
  const isArtwork = post.kind === 'artwork';

  return (
    <Paper
      component="button"
      type="button"
      onClick={() => onOpen(post)}
      aria-label={`Open “${post.title}”`}
      sx={{
        ...cardSx,
        p: 0,
        overflow: 'hidden',
        textAlign: 'left',
        font: 'inherit',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color .18s ease, box-shadow .18s ease, transform .18s ease',
        '&:hover': {
          borderColor: BRAND.magentaBorder,
          boxShadow: '0 12px 28px -16px rgba(18,18,20,.3)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Box sx={{ position: 'relative', p: isArtwork ? 1.25 : 0, bgcolor: isArtwork ? '#EFEAE0' : 'transparent' }}>
        <GalleryImage
          post={post}
          ratio="4 / 3"
          radius={isArtwork ? 2 : 0}
          sx={isArtwork ? { border: '1px solid rgba(18,18,20,.14)' } : undefined}
        />
        <Chip
          size="small"
          icon={
            isArtwork ? (
              <BrushRoundedIcon sx={{ fontSize: 14 }} />
            ) : (
              <PhotoCameraOutlinedIcon sx={{ fontSize: 14 }} />
            )
          }
          label={isArtwork ? 'Artwork' : 'Moment'}
          sx={{
            position: 'absolute',
            top: isArtwork ? 18 : 10,
            left: isArtwork ? 18 : 10,
            height: 24,
            fontSize: '0.68rem',
            bgcolor: 'rgba(255,255,255,0.94)',
            '& .MuiChip-icon': { color: BRAND.magenta },
          }}
        />
      </Box>

      <Box sx={{ p: 1.75, flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography variant="subtitle2" noWrap>
          {post.title}
        </Typography>
        {post.medium ? (
          <Typography variant="caption" color="text.secondary" noWrap>
            {post.medium}
          </Typography>
        ) : null}
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, mt: 'auto', pt: 0.75 }}>
          {spot ? (
            <Stack direction="row" sx={{ alignItems: 'center', gap: 0.35, minWidth: 0 }}>
              <PlaceOutlinedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary" noWrap>
                {spot.name}
              </Typography>
            </Stack>
          ) : null}
          <Stack direction="row" sx={{ alignItems: 'center', gap: 0.35, ml: 'auto', flexShrink: 0 }}>
            <FavoriteBorderRoundedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {post.likes}
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
}

export default function GalleryGrid({ posts, onOpen }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2.5,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          lg: 'repeat(3, minmax(0, 1fr))',
        },
      }}
    >
      {posts.map((post) => (
        <GalleryTile key={post.id} post={post} onOpen={onOpen} />
      ))}
    </Box>
  );
}

/**
 * What a private gallery looks like to everyone except its owner.
 *
 * It states the rule plainly rather than just showing an empty grid: the
 * work exists, and the artist has chosen not to share it. The post count
 * is deliberately still shown — that is the profile's own fact, not its
 * contents.
 */
export function LockedGallery({ person, count }) {
  return (
    <Paper sx={{ ...cardSx, p: { xs: 4, md: 6 }, textAlign: 'center' }}>
      <Box
        sx={{
          width: 54,
          height: 54,
          mx: 'auto',
          mb: 2.5,
          borderRadius: '50%',
          bgcolor: BRAND.magentaSoft,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <LockIcon />
      </Box>
      <Typography variant="h3" component="h2">
        This gallery is private
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1.25, mx: 'auto', maxWidth: '46ch' }}>
        {person.name} keeps their work to themselves for now. You can still see them at
        paint-outs and in event chats.
      </Typography>
      {count > 0 ? (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 2 }}>
          {count} {count === 1 ? 'piece' : 'pieces'} hidden
        </Typography>
      ) : null}
    </Paper>
  );
}

function LockIcon() {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      sx={{ width: 26, height: 26, color: BRAND.magenta }}
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 5a3 3 0 1 1 6 0v3H9V7Zm3 7a1.75 1.75 0 0 1 1 3.19V19a1 1 0 1 1-2 0v-1.81A1.75 1.75 0 0 1 12 14Z"
      />
    </Box>
  );
}
