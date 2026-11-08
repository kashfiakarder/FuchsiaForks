import { useState } from 'react';
import Button from '@mui/material/Button';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import { RADIUS } from '@/theme';

/**
 * Share control.
 *
 * Deliberately does NOT use `navigator.share`. Desktop Chrome exposes it
 * and then hands off to an OS sheet whose promise does not settle until
 * the person dismisses it — so the UI has no way to tell "shared" from
 * "still deciding", and an AbortError on dismissal is indistinguishable
 * from a real failure. A plain menu is predictable on every platform, and
 * copy-a-link is what people actually want here.
 *
 * The clipboard write is wrapped because it rejects outright on an
 * insecure origin or without permission, and a failed copy should not take
 * the page down with it.
 */
export default function ShareMenu({ title, text, children, ...buttonProps }) {
  const [anchor, setAnchor] = useState(null);
  const [toast, setToast] = useState(null);
  const url = typeof window === 'undefined' ? '' : window.location.href;

  const open = (event) => setAnchor(event.currentTarget);

  const copy = async () => {
    setAnchor(null);
    try {
      await navigator.clipboard.writeText(url);
      setToast('Link copied.');
    } catch {
      setToast('Couldn’t copy — here’s the link: ' + url);
    }
  };

  const email = () => {
    setAnchor(null);
    window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`;
  };

  return (
    <>
      <Button onClick={open} startIcon={<IosShareRoundedIcon />} {...buttonProps}>
        {children ?? 'Share'}
      </Button>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { minWidth: 210, borderRadius: `${RADIUS.md}px`, mt: 1 } } }}
      >
        <MenuItem onClick={copy}>
          <ListItemIcon>
            <ContentCopyRoundedIcon fontSize="small" />
          </ListItemIcon>
          Copy link
        </MenuItem>
        <MenuItem onClick={email}>
          <ListItemIcon>
            <MailOutlineRoundedIcon fontSize="small" />
          </ListItemIcon>
          Share by email
        </MenuItem>
      </Menu>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={2600}
        onClose={() => setToast(null)}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}
