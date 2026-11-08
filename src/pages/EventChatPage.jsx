import { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PushPinRoundedIcon from '@mui/icons-material/PushPinRounded';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SentimentSatisfiedAltRoundedIcon from '@mui/icons-material/SentimentSatisfiedAltRounded';

import PageBreadcrumbs from '@/components/common/PageBreadcrumbs';
import SceneImage from '@/components/common/SceneImage';
import { PersonAvatar } from '@/components/common/PersonAvatar';
import { profilePath } from '@/components/common/PersonLink';
import { formatChatDay, formatShortDate, formatTime, isSameDay } from '@/data/format';
import { useAppState } from '@/state/AppState';
import { BRAND, RADIUS, cardSx, tintSx } from '@/theme';

/** One bubble. Own messages sit right, in magenta; everyone else left, in grey. */
function Message({ message, event }) {
  const { user, getProfile } = useAppState();
  const mine = message.authorId === user?.id;
  const author = getProfile(message.authorId);
  const isHost = message.authorId === event.hostId;
  const isPrivate = author?.visibility === 'private';

  return (
    <Stack
      direction={mine ? 'row-reverse' : 'row'}
      spacing={1.25}
     
      sx={{ alignItems: "flex-start", mb: 2 }}
    >
      <Box
        component={RouterLink}
        to={profilePath(message.authorId, user?.id)}
        aria-label={`${mine ? 'Your' : `${author?.name}'s`} profile${isPrivate && !mine ? ' (private)' : ''}`}
        sx={{ display: 'inline-flex', flexShrink: 0, borderRadius: '50%' }}
      >
        <PersonAvatar personId={message.authorId} size={32} />
      </Box>
      <Box sx={{ maxWidth: '72%' }}>
        <Stack
          direction={mine ? 'row-reverse' : 'row'}
          spacing={1}
         
          sx={{ alignItems: "baseline", mb: 0.6 }}
        >
          <Typography variant="subtitle2">
            <Box
              component={RouterLink}
              to={profilePath(message.authorId, user?.id)}
              sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
            >
              {mine ? 'You' : author?.name}
            </Box>
            {isPrivate && !mine ? (
              <LockOutlinedIcon
                sx={{ fontSize: 12, color: 'text.disabled', ml: 0.4, verticalAlign: '-1px' }}
                titleAccess="Private profile"
              />
            ) : null}
            {isHost && !mine ? (
              <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                {' · Host'}
              </Box>
            ) : null}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatTime(message.at)}
          </Typography>
        </Stack>
        <Box
          sx={{
            px: 1.75,
            py: 1.25,
            borderRadius: `${RADIUS.md}px`,
            bgcolor: mine ? 'primary.main' : '#F3F3F6',
            color: mine ? 'primary.contrastText' : 'text.primary',
            borderTopRightRadius: mine ? 4 : RADIUS.md,
            borderTopLeftRadius: mine ? RADIUS.md : 4,
          }}
        >
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {message.body}
          </Typography>
        </Box>
      </Box>
    </Stack>
  );
}

/**
 * Event chat.
 *
 * A conversation list beside a thread, with the composer pinned to the
 * bottom. Messages you send are appended to shared state immediately, so
 * they survive navigating away and coming back.
 */
export default function EventChatPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { joinedEventIds, messagesByEvent, sendMessage, allEvents, findEvent, getSpot, getProfile, user } =
    useAppState();

  const conversations = useMemo(
    () => allEvents.filter((e) => joinedEventIds.includes(e.id)).sort((a, b) => a.start.localeCompare(b.start)),
    [allEvents, joinedEventIds],
  );

  const activeId = eventId ?? conversations[0]?.id;
  const event = findEvent(activeId);
  const messages = messagesByEvent[activeId] ?? [];

  const [draft, setDraft] = useState('');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const endRef = useRef(null);

  // Keep the newest message in view, including right after sending one.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length, activeId]);

  if (!event) {
    return (
      <Paper sx={{ ...cardSx, p: 5, textAlign: 'center' }}>
        <Typography variant="h3">No conversations yet</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Join a paint-out and its chat room will appear here.
        </Typography>
      </Paper>
    );
  }

  const submit = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    sendMessage(activeId, draft);
    setDraft('');
  };

  const onKeyDown = (e) => {
    // Enter sends; Shift+Enter is a newline. The hint under the composer
    // says so, because this is not discoverable otherwise.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit(e);
    }
  };

  return (
    <>
      <PageBreadcrumbs items={[{ label: 'My Events', to: '/my-events' }, { label: 'Event chats' }]} />

      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 320px) minmax(0, 1fr)' },
          alignItems: 'start',
        }}
      >
        {/* ---- Conversations ---- */}
        <Stack spacing={2.5} sx={{ display: { xs: 'none', md: 'flex' } }}>
          <Paper sx={{ ...cardSx, p: 2 }}>
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.75, width: '100%' }}>
              <Typography variant="h3" component="h2">
                Event chats
              </Typography>
              <Tooltip title="Start a conversation">
                <IconButton size="small" sx={{ color: 'primary.main' }} aria-label="Start a conversation">
                  <RateReviewOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>

            <TextField
              placeholder="Find a conversation"
              size="small"
              fullWidth
              slotProps={{
                htmlInput: { 'aria-label': 'Find a conversation' },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mt: 2.5, mb: 1 }}>
              My upcoming events
            </Typography>

            <Stack spacing={1}>
              {conversations.map((conv) => {
                const convSpot = getSpot(conv.spotId);
                const last = (messagesByEvent[conv.id] ?? []).at(-1);
                const lastAuthor = last
                  ? last.authorId === user?.id
                    ? 'You'
                    : getProfile(last.authorId)?.name.split(' ')[0]
                  : null;
                const active = conv.id === activeId;

                return (
                  <Box
                    key={conv.id}
                    component="button"
                    type="button"
                    onClick={() => navigate(`/chats/${conv.id}`)}
                    aria-current={active ? 'true' : undefined}
                    sx={{
                      textAlign: 'left',
                      width: '100%',
                      display: 'flex',
                      gap: 1.5,
                      p: 1.25,
                      cursor: 'pointer',
                      font: 'inherit',
                      borderRadius: `${RADIUS.md}px`,
                      border: `1px solid ${active ? BRAND.magentaBorder : 'transparent'}`,
                      bgcolor: active ? BRAND.magentaSoft : 'transparent',
                      '&:hover': { bgcolor: active ? BRAND.magentaSoft : '#FAFAFC' },
                    }}
                  >
                    <SceneImage
                      variant={conv.scene}
                      sx={{ width: 46, height: 46, flexShrink: 0 }}
                      radius={RADIUS.sm}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" noWrap>
                        {conv.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                        {convSpot?.name}
                      </Typography>
                      {last ? (
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mt: 0.5 }}>
                          {lastAuthor}: {last.body}
                        </Typography>
                      ) : null}
                      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mt: 0.75 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: active ? 'primary.main' : 'text.secondary' }}>
                          {formatShortDate(conv.start).toUpperCase()} · {formatTime(conv.start)}
                        </Typography>
                      </Stack>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </Paper>

          <Paper sx={{ ...tintSx('green'), p: 2.25 }}>
            <FavoriteBorderRoundedIcon sx={{ color: 'success.main', fontSize: 20 }} />
            <Typography variant="h5" sx={{ mt: 1 }}>
              A good space starts with us.
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Be welcoming, share generously and leave no trace.
            </Typography>
          </Paper>
        </Stack>

        {/* ---- Thread ---- */}
        <Paper sx={{ ...cardSx, display: 'flex', flexDirection: 'column', minHeight: { md: 640 } }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center", p: 2 }}>
            <SceneImage variant={event.scene} spotId={event.spotId} sx={{ width: 48, height: 48 }} radius={RADIUS.sm} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h4" component="h1" noWrap>
                {event.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {event.attendees} attendees · {formatShortDate(event.start)} · {formatTime(event.start)}
              </Typography>
            </Box>
            <Link component={RouterLink} to={`/events/${event.id}`} variant="body2">
              View event
            </Link>
            <IconButton
              size="small"
              aria-label="Conversation options"
              aria-haspopup="menu"
              onClick={(e) => setMenuAnchor(e.currentTarget)}
            >
              <MoreHorizRoundedIcon fontSize="small" />
            </IconButton>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
              slotProps={{ paper: { sx: { minWidth: 210, borderRadius: `${RADIUS.md}px` } } }}
            >
              <MenuItem onClick={() => setMenuAnchor(null)} component={RouterLink} to={`/events/${event.id}`}>
                Event details
              </MenuItem>
              <MenuItem onClick={() => setMenuAnchor(null)} component={RouterLink} to={`/spots/${event.spotId}`}>
                About the spot
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => setMenuAnchor(null)}>Mute this chat</MenuItem>
            </Menu>
          </Stack>

          {event.pinned ? (
            <Stack
              direction="row"
              spacing={1.25}
             
              sx={{ alignItems: "center", px: 2, py: 1.25, bgcolor: BRAND.magentaSoft, borderBlock: `1px solid ${BRAND.magentaBorder}` }}
            >
              <PushPinRoundedIcon sx={{ fontSize: 17, color: 'primary.main' }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {event.pinned}
              </Typography>
            </Stack>
          ) : null}

          <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, md: 3 }, maxHeight: { md: 460 } }}>
            {messages.map((message, i) => {
              const previous = messages[i - 1];
              const newDay = !previous || !isSameDay(previous.at, message.at);
              return (
                <Box key={message.id}>
                  {newDay ? (
                    <Typography
                      variant="overline"
                      color="text.secondary"
                      align="center"
                      sx={{ display: 'block', my: 2 }}
                    >
                      {formatChatDay(message.at)}
                    </Typography>
                  ) : null}
                  <Message message={message} event={event} />
                </Box>
              );
            })}
            <Typography variant="caption" color="text.secondary" align="right" sx={{ display: 'block' }}>
              You’re all caught up
            </Typography>
            <div ref={endRef} />
          </Box>

          <Divider />

          <Box component="form" onSubmit={submit} sx={{ p: 2 }}>
            <TextField
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Message your fellow painters..."
              fullWidth
              multiline
              maxRows={5}
              slotProps={{
                htmlInput: { 'aria-label': 'Write a message' },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconButton size="small" aria-label="Add an attachment">
                        <AddRoundedIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" aria-label="Add an emoji">
                        <SentimentSatisfiedAltRoundedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        type="submit"
                        size="small"
                        aria-label="Send message"
                        disabled={!draft.trim()}
                        sx={{
                          ml: 0.75,
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          '&:hover': { bgcolor: 'primary.dark' },
                          '&.Mui-disabled': { bgcolor: 'divider', color: 'text.disabled' },
                        }}
                      >
                        <ArrowUpwardRoundedIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Enter to send · Shift + Enter for a new line
            </Typography>
          </Box>
        </Paper>
      </Box>
    </>
  );
}
