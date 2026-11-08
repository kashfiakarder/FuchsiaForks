import { useRef, useState } from 'react';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { useAppState } from '@/state/AppState';

const ACCEPT = 'image/jpeg,image/png,image/gif,image/webp';
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Join is confirmed by a picture. The button opens the camera (or a file
 * picker on a computer) and only then tells the server you are on the route.
 */
export default function JoinRouteButton({ routeId, label = 'Join this route', hint, fullWidth, variant = 'contained', sx }) {
  const { joinRoute } = useAppState();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Choose a photo — JPEG, PNG, GIF, or WebP.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('That image is larger than 8 MB.');
      return;
    }
    setError('');
    setBusy(true);
    await joinRoute(routeId, file);
    setBusy(false);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        capture="environment"
        hidden
        onChange={onFile}
      />
      <Button
        variant={variant}
        fullWidth={fullWidth}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        sx={sx}
      >
        {busy ? 'Joining…' : label}
      </Button>
      {hint || error ? (
        <Typography variant="caption" color={error ? 'error' : 'text.secondary'} sx={{ display: 'block' }}>
          {error || hint}
        </Typography>
      ) : null}
    </>
  );
}
