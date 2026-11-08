import Box from '@mui/material/Box';

import SceneImage from '@/components/common/SceneImage';

/**
 * A gallery picture.
 *
 * Uploaded posts carry `imageUrl`. Seeded posts do not, and fall back to
 * the same scene illustration the rest of the app draws.
 */
export default function GalleryImage({ post, title, ratio, height, radius = 0, sx }) {
  if (!post?.imageUrl) {
    return (
      <SceneImage
        variant={post?.scene}
        title={title}
        ratio={ratio}
        height={height}
        radius={radius}
        sx={sx}
      />
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: `${radius}px`,
        bgcolor: '#D9DEE6',
        ...(height ? { height } : null),
        ...(ratio ? { aspectRatio: ratio } : null),
        ...sx,
      }}
    >
      <Box
        component="img"
        src={post.imageUrl}
        alt={title || ''}
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </Box>
  );
}
