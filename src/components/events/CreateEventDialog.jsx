import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import Typography from '@mui/material/Typography';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

import SceneImage from '@/components/common/SceneImage';
import { SPOTS, getSpot } from '@/data/mockData';
import { useAppState } from '@/state/AppState';
import { RADIUS } from '@/theme';

const BADGES = ['Community paint-out', 'Hosted paint-out', 'Sketch social', 'Early session', 'Walk and draw'];
const SKILL = ['All skill levels welcome', 'Beginners very welcome', 'Bring any medium', 'Quiet, focused session'];

/** Tomorrow, so the default is always a valid future date. */
function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const EMPTY = {
  title: '',
  spotId: SPOTS[0].id,
  date: tomorrow(),
  startTime: '10:00',
  endTime: '12:30',
  meetingPoint: '',
  badge: BADGES[0],
  skillNote: SKILL[0],
  description: '',
};

/**
 * Create a paint-out.
 *
 * Validation is kept to the two things that would actually break the
 * listing — a missing title and an end time before the start. Everything
 * else has a sensible default, because the fastest way to get no events
 * created is to put a wall of required fields in front of someone.
 */
export default function CreateEventDialog({ open, onClose }) {
  const { createEvent } = useAppState();
  const navigate = useNavigate();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  const spot = useMemo(() => getSpot(values.spotId), [values.spotId]);
  const set = (name) => (event) => {
    const { value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  };

  const submit = () => {
    const found = {};
    if (!values.title.trim()) found.title = 'Give your paint-out a name.';
    if (values.endTime <= values.startTime) found.endTime = 'End time must be after the start.';
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    const created = createEvent(values);
    setValues(EMPTY);
    setErrors({});
    onClose();
    navigate(`/events/${created.id}`);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="create-event-title">
      <DialogContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography id="create-event-title" variant="h2" sx={{ fontSize: '1.6rem' }}>
              Plan a paint-out
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Pick a spot and a time. People will find it from Discover.
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close" size="small" sx={{ mt: -0.5, mr: -0.5 }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Stack spacing={2.25}>
          <TextField
            label="Event name"
            value={values.title}
            onChange={set('title')}
            error={Boolean(errors.title)}
            helperText={errors.title || ' '}
            placeholder="Creekside Colour Study"
            fullWidth
            autoFocus
          />

          <TextField select label="Painting spot" value={values.spotId} onChange={set('spotId')} fullWidth>
            {SPOTS.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name} — {s.region}
              </MenuItem>
            ))}
          </TextField>

          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <SceneImage variant={spot.scene} spotId={spot.id} sx={{ width: 76, height: 56 }} radius={RADIUS.sm} />
            <Box>
              <Typography variant="subtitle2">{spot.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {spot.address}, {spot.city}
              </Typography>
            </Box>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label="Date"
              type="date"
              value={values.date}
              onChange={set('date')}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Start"
              type="time"
              value={values.startTime}
              onChange={set('startTime')}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="End"
              type="time"
              value={values.endTime}
              onChange={set('endTime')}
              error={Boolean(errors.endTime)}
              helperText={errors.endTime || ' '}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>

          <TextField
            label="Where exactly to meet"
            value={values.meetingPoint}
            onChange={set('meetingPoint')}
            placeholder={spot.address}
            helperText="Leave blank to use the spot's address."
            fullWidth
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField select label="Kind of session" value={values.badge} onChange={set('badge')} fullWidth>
              {BADGES.map((b) => (
                <MenuItem key={b} value={b}>
                  {b}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="Who it's for" value={values.skillNote} onChange={set('skillNote')} fullWidth>
              {SKILL.map((b) => (
                <MenuItem key={b} value={b}>
                  {b}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <TextField
            label="What to expect"
            value={values.description}
            onChange={set('description')}
            placeholder="Tell people what the session is like, and what to bring."
            multiline
            minRows={3}
            fullWidth
          />
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: { xs: 2.5, sm: 3.5 }, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={submit} variant="contained">
          Publish paint-out
        </Button>
      </DialogActions>
    </Dialog>
  );
}
