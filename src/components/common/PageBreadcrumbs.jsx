import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

/**
 * Back arrow plus a trail. The arrow goes back in history where there is
 * history to go back to, and falls back to the first crumb otherwise — so
 * the control still works on a cold load from a shared link.
 */
export default function PageBreadcrumbs({ items }) {
  const navigate = useNavigate();
  const first = items.find((i) => i.to);

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(first?.to ?? '/discover');
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
      <IconButton onClick={goBack} size="small" aria-label="Go back" sx={{ color: 'text.primary' }}>
        <ArrowBackRoundedIcon fontSize="small" />
      </IconButton>
      <Breadcrumbs separator="/" sx={{ fontSize: '0.88rem' }}>
        {items.map((item, i) =>
          item.to && i < items.length - 1 ? (
            <Link
              key={item.label}
              component={RouterLink}
              to={item.to}
              color="text.secondary"
              sx={{ fontWeight: 500, fontSize: '0.88rem' }}
            >
              {item.label}
            </Link>
          ) : (
            <Typography
              key={item.label}
              color={i === items.length - 1 ? 'text.primary' : 'text.secondary'}
              sx={{ fontWeight: i === items.length - 1 ? 600 : 500, fontSize: '0.88rem' }}
            >
              {item.label}
            </Typography>
          ),
        )}
      </Breadcrumbs>
    </Box>
  );
}
