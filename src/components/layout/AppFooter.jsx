import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { BRAND } from '@/theme';

/**
 * The standing footer. Deliberately plain: one brand line, one set of
 * secondary links, nothing that competes with the page above it.
 */
export default function AppFooter() {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: `1px solid ${BRAND.line}`,
        bgcolor: 'background.paper',
        mt: 'auto',
      }}
    >
      <Box
        sx={{
          maxWidth: 1360,
          mx: 'auto',
          px: { xs: 2, md: 4 },
          py: 2.5,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1.5,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
            FUCHSIA
          </Box>
          {'  /  Made for the outside.'}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          Calgary, Alberta
          {'  ·  '}
          <Link href="#guidelines" color="inherit" sx={{ fontWeight: 400 }}>
            Community guidelines
          </Link>
          {'  ·  '}
          <Link href="#help" color="inherit" sx={{ fontWeight: 400 }}>
            Help
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
