import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import SceneImage from '@/components/common/SceneImage';
import { RADIUS } from '@/theme';

export default function NotFoundPage() {
  return (
    <Box sx={{ maxWidth: 520, mx: 'auto', textAlign: 'center', py: { xs: 4, md: 8 } }}>
      <SceneImage variant="prairie" height={180} radius={RADIUS.lg} />
      <Typography variant="h2" component="h1" sx={{ mt: 4 }}>
        Nothing out here.
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1.5, mb: 3.5 }}>
        That page has wandered off. Let’s get you back to somewhere worth painting.
      </Typography>
      <Button component={RouterLink} to="/discover" variant="contained" size="large">
        Back to Discover
      </Button>
    </Box>
  );
}
