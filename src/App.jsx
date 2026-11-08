import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';

import AppShell from '@/components/layout/AppShell';
import LoginPage from '@/features/auth/LoginPage';
import SignUpPage from '@/features/auth/SignUpPage';
import ProtectedRoute, { PublicOnlyRoute } from '@/features/auth/ProtectedRoute';
import DiscoverPage from '@/pages/DiscoverPage';
import EventDetailPage from '@/pages/EventDetailPage';
import EventChatPage from '@/pages/EventChatPage';
import SpotDetailPage from '@/pages/SpotDetailPage';
import MyEventsPage from '@/pages/MyEventsPage';
import RoutesPage from '@/pages/RoutesPage';
import ProfilePage from '@/pages/ProfilePage';
import NotFoundPage from '@/pages/NotFoundPage';
import { useAppState } from '@/state/AppState';

/**
 * Routes. Auth0 is the source of truth for sign-in; AppShell routes are guarded.
 */
export default function App() {
  const { isAuthenticated, isLoading } = useAuth0();
  const { toast, clearToast, catalogLoading, catalogError } = useAppState();

  if (isLoading || catalogLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress aria-label="Loading" />
      </Box>
    );
  }

  if (catalogError) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'background.default',
          px: 3,
          textAlign: 'center',
        }}
      >
        <Box>
          <Typography variant="h3">Fuchsia couldn’t load</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {catalogError}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? '/discover' : '/login'} replace />}
        />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnlyRoute>
              <SignUpPage />
            </PublicOnlyRoute>
          }
        />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/events/:eventId" element={<EventDetailPage />} />
            <Route path="/spots/:spotId" element={<SpotDetailPage />} />
            <Route path="/chats" element={<EventChatPage />} />
            <Route path="/chats/:eventId" element={<EventChatPage />} />
            <Route path="/my-events" element={<MyEventsPage />} />
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/profile" element={<ProfilePage own />} />
            <Route path="/artists/:userId" element={<ProfilePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={2600}
        onClose={clearToast}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}
