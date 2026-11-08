import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { Link as RouterLink } from 'react-router-dom';

import SceneImage from '@/components/common/SceneImage';
import PersonLink from '@/components/common/PersonLink';
import { getSpot } from '@/data/mockData';
import { formatReviewDate } from '@/data/format';
import { useAppState } from '@/state/AppState';
import { BRAND, RADIUS } from '@/theme';

/**
 * A single gallery post, full size.
 *
 * The links back to the spot and the event are the point of this dialog:
 * a piece of work is tied to a real place someone stood and, often, to a
 * session other people were at.
 */
export default function GalleryPostDialog({ post, owner, onClose, canDelete }) {
  const { findEvent, removeGalleryPost } = useAppState();
  const open = Boolean(post);
  const spot = post?.spotId ? getSpot(post.spotId) : null;
  const event = post?.eventId ? findEvent(post.eventId) : null;
  const isArtwork = post?.kind === 'artwork';

  const remove = () => {
    removeGalleryPost(post.id);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth aria-labelledby="gallery-post-title">
      {post ? (
        <>
          <Box sx={{ position: 'relative', bgcolor: isArtwork ? '#EFEAE0' : '#101013', p: isArtwork ? 3 : 0 }}>
            <SceneImage
              variant={post.scene}
              ratio="16 / 10"
              radius={isArtwork ? 3 : 0}
              title={post.title}
              sx={isArtwork ? { border: '1px solid rgba(18,18,20,.16)' } : undefined}
            />
            <IconButton
              onClick={onClose}
              aria-label="Close"
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                bgcolor: 'rgba(255,255,255,.94)',
                '&:hover': { bgcolor: '#fff' },
              }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
              <Box>
                <Typography id="gallery-post-title" variant="h3" component="h2">
                  {post.title}
                </Typography>
                {post.medium ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                    {post.medium}
                  </Typography>
                ) : null}
              </Box>
              <Chip
                size="small"
                label={isArtwork ? 'Artwork' : 'Moment'}
                sx={{ bgcolor: BRAND.magentaSoft, color: BRAND.magentaDark, fontWeight: 700 }}
              />
            </Stack>

            {post.caption ? (
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                {post.caption}
              </Typography>
            ) : null}

            <Divider sx={{ my: 2.5 }} />

            <Stack
              direction="row"
              sx={{ flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}
            >
              <PersonLink personId={owner.id} size={34} secondary={formatReviewDate(post.date)} />

              <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                {spot ? (
                  <Button
                    component={RouterLink}
                    to={`/spots/${spot.id}`}
                    size="small"
                    variant="outlined"
                    startIcon={<PlaceOutlinedIcon />}
                  >
                    {spot.name}
                  </Button>
                ) : null}
                {event ? (
                  <Button
                    component={RouterLink}
                    to={`/events/${event.id}`}
                    size="small"
                    variant="outlined"
                    startIcon={<EventOutlinedIcon />}
                  >
                    {event.title}
                  </Button>
                ) : null}
              </Stack>
            </Stack>

            <Stack
              direction="row"
              sx={{ alignItems: 'center', gap: 2, mt: 2.5, justifyContent: 'space-between' }}
            >
              <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
                <FavoriteBorderRoundedIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {post.likes} {post.likes === 1 ? 'like' : 'likes'}
                </Typography>
              </Stack>

              {canDelete ? (
                <Button
                  onClick={remove}
                  size="small"
                  color="error"
                  startIcon={<DeleteOutlineRoundedIcon />}
                >
                  Remove from gallery
                </Button>
              ) : null}
            </Stack>
          </Box>
        </>
      ) : null}
    </Dialog>
  );
}
