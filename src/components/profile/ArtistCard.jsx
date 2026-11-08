import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';

import GalleryImage from '@/components/profile/GalleryImage';
import { PersonAvatar } from '@/components/common/PersonAvatar';
import { profilePath } from '@/components/common/PersonLink';
import PrivacyBadge from './PrivacyBadge';
import { useAppState } from '@/state/AppState';
import { BRAND, RADIUS, cardSx } from '@/theme';

/**
 * An artist in the directory.
 *
 * Private profiles appear here in full — the person is not hidden, only
 * their gallery is. Instead of thumbnails the card shows the privacy
 * state, so the difference is obvious before anyone clicks.
 */
export default function ArtistCard({ person }) {
  const { canViewGallery, galleryFor, user } = useAppState();
  const visible = canViewGallery(person.id);
  const posts = galleryFor(person.id);
  const preview = visible ? posts.slice(0, 3) : [];

  return (
    <Paper
      component={RouterLink}
      to={profilePath(person.id, user?.id)}
      sx={{
        ...cardSx,
        display: 'block',
        p: 2.25,
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color .18s ease, box-shadow .18s ease, transform .18s ease',
        '&:hover': {
          borderColor: BRAND.magentaBorder,
          boxShadow: '0 10px 26px -14px rgba(18,18,20,.26)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <PersonAvatar personId={person.id} size={46} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="h5" noWrap>
            {person.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            @{person.handle} · {person.city}
          </Typography>
        </Box>
      </Stack>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          mt: 1.5,
          minHeight: 40,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {person.bio}
      </Typography>

      <Box sx={{ mt: 1.75, minHeight: 58 }}>
        {visible && preview.length ? (
          <Stack direction="row" spacing={1}>
            {preview.map((post) => (
              <GalleryImage
                key={post.id}
                post={post}
                sx={{ flex: 1, height: 58 }}
                radius={RADIUS.sm}
              />
            ))}
          </Stack>
        ) : (
          <Box
            sx={{
              height: 58,
              borderRadius: `${RADIUS.sm}px`,
              border: `1px dashed ${BRAND.line}`,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Typography variant="caption" color="text.disabled">
              {visible ? 'No work shared yet' : 'Gallery is private'}
            </Typography>
          </Box>
        )}
      </Box>

      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 1.75 }}>
        <PrivacyBadge visibility={person.visibility} compact />
        <Typography variant="caption" color="text.secondary">
          {person.followers} followers
        </Typography>
      </Stack>
    </Paper>
  );
}
