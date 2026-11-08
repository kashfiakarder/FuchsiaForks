import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';

import { useAppState } from '@/state/AppState';
import { BRAND, RADIUS } from '@/theme';

const ACCEPT = 'image/jpeg,image/png,image/gif,image/webp';
const MAX_BYTES = 8 * 1024 * 1024;

const EMPTY = {
  kind: 'artwork',
  title: '',
  medium: '',
  caption: '',
  spotId: '',
  file: null,
};

export default function AddArtworkDialog({ open, onClose }) {
  const { addGalleryPost, spots } = useAppState();
  const [values, setValues] = useState(EMPTY);
  const [titleError, setTitleError] = useState('');
  const [imageError, setImageError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!values.file) {
      setPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(values.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [values.file]);

  const set = (name) => (event) => {
    setValues((prev) => ({ ...prev, [name]: event.target.value }));
    if (name === 'title') setTitleError('');
  };

  const onFile = (event) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setValues((prev) => ({ ...prev, file: null }));
      return;
    }
    if (file.size > MAX_BYTES) {
      setImageError('That image is larger than 8 MB.');
      event.target.value = '';
      return;
    }
    setImageError('');
    setValues((prev) => ({ ...prev, file }));
  };

  const submit = async () => {
    const missingTitle = !values.title.trim();
    const missingImage = !values.file;
    setTitleError(missingTitle ? 'Give it a title.' : '');
    setImageError(missingImage ? 'Choose an image.' : '');
    if (missingTitle || missingImage) return;

    const created = await addGalleryPost(values);
    if (!created) return;
    setValues(EMPTY);
    setTitleError('');
    setImageError('');
    onClose();
  };

  const close = () => {
    setValues(EMPTY);
    setTitleError('');
    setImageError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm" aria-labelledby="add-art-title">
      <DialogContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
          <Box>
            <Typography id="add-art-title" variant="h2" sx={{ fontSize: '1.6rem' }}>
              Add to your gallery
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              A finished piece, a work in progress, or a moment from a session.
            </Typography>
          </Box>
          <IconButton onClick={close} aria-label="Close" size="small" sx={{ mt: -0.5, mr: -0.5 }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>

        <ToggleButtonGroup
          exclusive
          fullWidth
          value={values.kind}
          onChange={(_, v) => v && setValues((prev) => ({ ...prev, kind: v }))}
          aria-label="What are you adding"
          sx={{
            mb: 2.5,
            '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 600, py: 1 },
          }}
        >
          <ToggleButton value="artwork">Artwork</ToggleButton>
          <ToggleButton value="moment">Moment</ToggleButton>
        </ToggleButtonGroup>

        <Stack spacing={2.25}>
          <TextField
            label="Title"
            value={values.title}
            onChange={set('title')}
            error={Boolean(titleError)}
            helperText={titleError || ' '}
            placeholder={values.kind === 'artwork' ? 'Fish Creek, first frost' : 'The Thursday crowd'}
            fullWidth
            autoFocus
          />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Image
            </Typography>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Box
                sx={{
                  position: 'relative',
                  width: 108,
                  height: 80,
                  flexShrink: 0,
                  overflow: 'hidden',
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: values.kind === 'artwork' ? '#EFEAE0' : '#101013',
                  borderRadius: `${RADIUS.sm}px`,
                  border: previewUrl ? 'none' : `1px dashed ${BRAND.line}`,
                }}
              >
                {previewUrl ? (
                  <Box
                    component="img"
                    src={previewUrl}
                    alt=""
                    sx={{
                      position: 'absolute',
                      inset: values.kind === 'artwork' ? 6 : 0,
                      objectFit: 'cover',
                      borderRadius: values.kind === 'artwork' ? 1 : 0,
                    }}
                  />
                ) : (
                  <ImageOutlinedIcon sx={{ color: 'text.disabled' }} />
                )}
              </Box>
              <Box>
                <Button variant="outlined" component="label">
                  Choose image
                  <input hidden type="file" accept={ACCEPT} onChange={onFile} />
                </Button>
                <Typography
                  variant="caption"
                  color={imageError ? 'error' : 'text.secondary'}
                  sx={{ display: 'block', mt: 0.75 }}
                >
                  {imageError || 'JPEG, PNG, GIF, or WebP. Up to 8 MB.'}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {values.kind === 'artwork' ? (
            <TextField
              label="Medium"
              value={values.medium}
              onChange={set('medium')}
              placeholder="Watercolour on cold press"
              fullWidth
            />
          ) : null}

          <TextField select label="Where was this?" value={values.spotId} onChange={set('spotId')} fullWidth>
            <MenuItem value="">
              <em>Not at a listed spot</em>
            </MenuItem>
            {spots.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name} — {s.region}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Caption"
            value={values.caption}
            onChange={set('caption')}
            placeholder="How it went, what you were after, what you'd change."
            multiline
            minRows={3}
            fullWidth
          />
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: { xs: 2.5, sm: 3.5 }, py: 2 }}>
        <Button onClick={close} variant="outlined">
          Cancel
        </Button>
        <Button onClick={submit} variant="contained">
          Add to gallery
        </Button>
      </DialogActions>
    </Dialog>
  );
}
