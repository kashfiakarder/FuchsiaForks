import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';

/** The Fuchsia flower glyph. Inline so it always matches `currentColor`. */
export function BrandGlyph({ size = 28 }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 32 32"
      sx={{ width: size, height: size, display: 'block', flexShrink: 0 }}
      aria-hidden="true"
      focusable="false"
    >
      <g fill="currentColor">
        <circle cx="16" cy="8.4" r="4" />
        <circle cx="10.2" cy="13.6" r="4" />
        <circle cx="21.8" cy="13.6" r="4" />
        <circle cx="16" cy="13.6" r="2.6" fill="#fff" />
        <rect x="15" y="16.6" width="2" height="10" rx="1" />
        <path d="M15.4 22.4c-2.9.2-5-1.2-5.8-3.6 2.9-.8 5.2.3 5.8 3.6Z" />
        <path d="M16.6 26c2.9.2 5-1.2 5.8-3.6-2.9-.8-5.2.3-5.8 3.6Z" />
      </g>
    </Box>
  );
}

/**
 * Logo lockup. Renders as a link to the given route unless `to` is null,
 * which is how it is used inside the auth card where it is purely a mark.
 */
export default function BrandMark({ size = 28, fontSize = '1.22rem', to = '/discover' }) {
  const content = (
    <>
      <BrandGlyph size={size} />
      <Typography
        component="span"
        sx={{
          fontWeight: 800,
          fontSize,
          letterSpacing: '0.04em',
          lineHeight: 1,
          color: 'primary.main',
        }}
      >
        FUCHSIA
      </Typography>
    </>
  );

  const sx = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 1.15,
    color: 'primary.main',
    textDecoration: 'none',
  };

  if (!to) return <Box sx={sx}>{content}</Box>;
  return (
    <Box component={RouterLink} to={to} sx={sx} aria-label="Fuchsia — home">
      {content}
    </Box>
  );
}
