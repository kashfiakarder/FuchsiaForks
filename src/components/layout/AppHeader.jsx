import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, NavLink, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import BrandMark from '@/components/common/BrandMark';
import { BRAND, RADIUS } from '@/theme';
import { useAppState } from '@/state/AppState';

const NAV = [
  { label: 'Discover', to: '/discover' },
  { label: 'My Events', to: '/my-events' },
];

/**
 * The signed-in application bar: brand, two primary destinations, a search
 * field and the account cluster.
 *
 * The active route is marked with colour *and* `aria-current`, so the state
 * is available to a screen reader rather than being carried by magenta text
 * alone.
 */
const NOTIFICATIONS = [
  { id: 'n1', title: 'Maya Chen posted in Creekside Colour Study', when: 'about 2 hours ago', to: '/chats/creekside-colour-study' },
  { id: 'n2', title: 'Jamie Lee is bringing extra paper to the reservoir', when: 'yesterday', to: '/chats/reservoir-light-layers' },
  { id: 'n3', title: 'Lake Louise Shoreline has a new 5-star review', when: '2 days ago', to: '/spots/lake-louise' },
];

export default function AppHeader() {
  const { user, signOut } = useAppState();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(null);
  const [bellAnchor, setBellAnchor] = useState(null);
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);

  // The header advertises ⌘K, so it has to actually do something.
  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const runSearch = (event) => {
    event.preventDefault();
    navigate(query.trim() ? `/discover?q=${encodeURIComponent(query.trim())}` : '/discover');
  };

  const handleSignOut = () => {
    setAnchor(null);
    signOut();
    navigate('/login');
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: `1px solid ${BRAND.line}`,
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 62, md: 72 },
          gap: { xs: 1, md: 3 },
          px: { xs: 2, md: 4 },
          maxWidth: 1360,
          width: '100%',
          mx: 'auto',
        }}
      >
        <BrandMark />

        <Box
          component="nav"
          aria-label="Primary"
          sx={{ display: { xs: 'none', md: 'flex' }, gap: 3, ml: 3 }}
        >
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
              {({ isActive }) => (
                <Typography
                  component="span"
                  aria-current={isActive ? 'page' : undefined}
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    color: isActive ? 'primary.main' : 'text.primary',
                    '&:hover': { color: isActive ? 'primary.dark' : 'text.secondary' },
                  }}
                >
                  {item.label}
                </Typography>
              )}
            </NavLink>
          ))}
        </Box>

        <Box sx={{ flex: 1 }} />

        <Box
          component="form"
          role="search"
          onSubmit={runSearch}
          sx={{
            display: { xs: 'none', sm: 'flex' },
            alignItems: 'center',
            gap: 1,
            width: { sm: 240, md: 360 },
            px: 1.75,
            py: 0.9,
            borderRadius: `${RADIUS.sm}px`,
            border: `1px solid ${BRAND.line}`,
            bgcolor: '#FAFAFC',
            '&:focus-within': { borderColor: 'primary.main', bgcolor: 'background.paper' },
          }}
        >
          <SearchRoundedIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
          <InputBase
            inputRef={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search spots, events or artists"
            inputProps={{ 'aria-label': 'Search spots, events or artists' }}
            sx={{ flex: 1, fontSize: '0.88rem' }}
          />
          <Typography
            component="kbd"
            variant="caption"
            sx={{ color: 'text.disabled', fontFamily: 'inherit', letterSpacing: '0.04em' }}
          >
            ⌘ K
          </Typography>
        </Box>

        <Box sx={{ flex: { xs: 1, sm: 'none' } }} />

        <Tooltip title="Notifications">
          <IconButton
            onClick={(e) => setBellAnchor(e.currentTarget)}
            size="small"
            aria-label={`Notifications, ${NOTIFICATIONS.length} new`}
            aria-haspopup="menu"
            sx={{ color: 'text.primary' }}
          >
            <Badge color="primary" variant="dot" overlap="circular">
              <NotificationsNoneRoundedIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={bellAnchor}
          open={Boolean(bellAnchor)}
          onClose={() => setBellAnchor(null)}
          slotProps={{ paper: { sx: { width: 320, borderRadius: `${RADIUS.md}px`, mt: 1 } } }}
        >
          <Typography variant="overline" sx={{ px: 2, py: 1, display: 'block', color: 'text.secondary' }}>
            Notifications
          </Typography>
          <Divider />
          {NOTIFICATIONS.map((n) => (
            <MenuItem
              key={n.id}
              component={RouterLink}
              to={n.to}
              onClick={() => setBellAnchor(null)}
              sx={{ whiteSpace: 'normal', alignItems: 'flex-start', py: 1.25 }}
            >
              <ListItemText
                primary={n.title}
                secondary={n.when}
                slotProps={{
                  primary: { variant: 'body2', sx: { fontWeight: 600 } },
                  secondary: { variant: 'caption' },
                }}
              />
            </MenuItem>
          ))}
        </Menu>

        <IconButton
          onClick={(e) => setAnchor(e.currentTarget)}
          size="small"
          aria-label="Account menu"
          aria-haspopup="menu"
        >
          <Avatar sx={{ width: 34, height: 34, bgcolor: user.tint, color: 'text.primary' }}>
            {user.initials}
          </Avatar>
        </IconButton>

        <Menu
          anchorEl={anchor}
          open={Boolean(anchor)}
          onClose={() => setAnchor(null)}
          slotProps={{ paper: { sx: { minWidth: 200, borderRadius: `${RADIUS.md}px`, mt: 1 } } }}
        >
          <Box sx={{ px: 2, py: 1.25 }}>
            <Typography variant="subtitle2">{user.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {user.city}
            </Typography>
          </Box>
          <MenuItem onClick={() => setAnchor(null)} component={RouterLink} to="/profile">
            My profile
          </MenuItem>
          <MenuItem onClick={() => setAnchor(null)} component={RouterLink} to="/my-events">
            My Events
          </MenuItem>
          <MenuItem onClick={() => setAnchor(null)} component={RouterLink} to="/discover">
            Discover spots
          </MenuItem>
          <MenuItem onClick={handleSignOut}>Sign out</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
