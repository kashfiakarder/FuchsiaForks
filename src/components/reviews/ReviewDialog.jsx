import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Rating from '@mui/material/Rating';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import StarOutlineRoundedIcon from '@mui/icons-material/StarOutlineRounded';

import { PersonAvatar } from '@/components/common/PersonAvatar';
import { useAppState } from '@/state/AppState';

const WORDS = ['', 'Not for me', 'It was okay', 'Good spot', 'Really liked it', 'Loved it'];
const MAX = 1000;

/**
 * Write a review.
 *
 * The rating is required and the words are not — asking for prose is the
 * fastest way to get no feedback at all. The submit button stays disabled
 * until a star is chosen rather than letting someone submit nothing and
 * then telling them off for it.
 */
export default function ReviewDialog({ open, onClose, spot }) {
  const { user, addReview } = useAppState();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');

  // Reset whenever the dialog is reopened, so a previous draft never
  // reappears under a different spot.
  useEffect(() => {
    if (open) {
      setRating(5);
      setBody('');
    }
  }, [open]);

  const submit = () => {
    addReview(spot.id, { rating, body });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="review-dialog-title"
    >
      <DialogContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
        <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
          <Typography id="review-dialog-title" variant="h2" sx={{ fontSize: '1.6rem' }}>
            Share your view
          </Typography>
          <IconButton onClick={onClose} aria-label="Close" size="small" sx={{ mt: -0.5, mr: -0.5 }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Typography variant="h5">{spot.name}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
          Your experience helps another artist find their next spot.
        </Typography>

        <Typography component="legend" variant="subtitle2" sx={{ mb: 1 }}>
          How was your painting spot?
        </Typography>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 3 }}>
          <Rating
            name="spot-rating"
            value={rating}
            onChange={(_, value) => setRating(value ?? 0)}
            icon={<StarRoundedIcon sx={{ fontSize: 36 }} />}
            emptyIcon={<StarOutlineRoundedIcon sx={{ fontSize: 36, color: 'divider' }} />}
            sx={{ color: 'primary.main' }}
          />
          <Typography variant="subtitle1" color="primary.main">
            {WORDS[rating] ?? ''}
          </Typography>
        </Stack>

        <Typography component="label" htmlFor="review-body" variant="subtitle2" sx={{ display: 'block', mb: 1 }}>
          Your review{' '}
          <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>
            (optional)
          </Box>
        </Typography>
        <TextField
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX))}
          placeholder="Tell others about the view..."
          multiline
          minRows={4}
          fullWidth
          slotProps={{ htmlInput: { maxLength: MAX } }}
        />
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', textAlign: 'right', mt: 0.75 }}
        >
          {body.length} / {MAX.toLocaleString()}
        </Typography>

        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mt: 2 }}>
          <PersonAvatar person={user} size={28} />
          <Typography variant="body2" color="text.secondary">
            Posting as {user.name}
          </Typography>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: { xs: 2.5, sm: 3.5 }, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={submit} variant="contained" disabled={!rating}>
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
}
