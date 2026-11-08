import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

import SceneImage from '@/components/common/SceneImage';
import { RADIUS } from '@/theme';

/**
 * Full-size photo viewer.
 *
 * Arrow keys move between images, which is what anyone who opens a gallery
 * reaches for first. MUI's Dialog already traps focus and closes on Escape.
 */
export default function PhotoLightbox({ open, onClose, photos, title, startIndex = 0 }) {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    if (open) setIndex(startIndex);
  }, [open, startIndex]);

  const step = useCallback(
    (delta) => setIndex((i) => (i + delta + photos.length) % photos.length),
    [photos.length],
  );

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, step]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth aria-label={`${title} photos`}>
      <Box sx={{ position: 'relative', bgcolor: '#101013' }}>
        <SceneImage
          variant={photos[index]}
          ratio="16 / 10"
          title={`${title} — photo ${index + 1} of ${photos.length}`}
        />

        <IconButton
          onClick={onClose}
          aria-label="Close photos"
          sx={{ position: 'absolute', top: 10, right: 10, bgcolor: 'rgba(255,255,255,.92)', '&:hover': { bgcolor: '#fff' } }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>

        {photos.length > 1 ? (
          <>
            <IconButton
              onClick={() => step(-1)}
              aria-label="Previous photo"
              sx={{ position: 'absolute', top: '50%', left: 10, transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,.92)', '&:hover': { bgcolor: '#fff' } }}
            >
              <ChevronLeftRoundedIcon />
            </IconButton>
            <IconButton
              onClick={() => step(1)}
              aria-label="Next photo"
              sx={{ position: 'absolute', top: '50%', right: 10, transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,.92)', '&:hover': { bgcolor: '#fff' } }}
            >
              <ChevronRightRoundedIcon />
            </IconButton>
          </>
        ) : null}
      </Box>

      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2, p: 2 }}>
        <Typography variant="subtitle2">{title}</Typography>
        <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
          {photos.map((photo, i) => (
            <Box
              key={`${photo}-${i}`}
              component="button"
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
              sx={{
                width: 44,
                height: 32,
                p: 0,
                cursor: 'pointer',
                borderRadius: `${RADIUS.sm}px`,
                overflow: 'hidden',
                border: (t) => `2px solid ${i === index ? t.palette.primary.main : 'transparent'}`,
              }}
            >
              <SceneImage variant={photo} sx={{ width: '100%', height: '100%' }} />
            </Box>
          ))}
        </Stack>
      </Stack>
    </Dialog>
  );
}
