import { Navigate, Route, Routes } from 'react-router-dom';
import Snackbar from '@mui/material/Snackbar';

import AppShell from '@/components/layout/AppShell';
import LoginPage from '@/features/auth/LoginPage';
import SignUpPage from '@/features/auth/SignUpPage';
import DiscoverPage from '@/pages/DiscoverPage';
import EventDetailPage from '@/pages/EventDetailPage';
import EventChatPage from '@/pages/EventChatPage';
import SpotDetailPage from '@/pages/SpotDetailPage';
import MyEventsPage from '@/pages/MyEventsPage';
import ProfilePage from '@/pages/ProfilePage';
import NotFoundPage from '@/pages/NotFoundPage';
import { useAppState } from '@/state/AppState';

/**
 * Routes.
 *
 * `/` sends you to the app if this browser has signed in before and to the
 * login screen otherwise. Nothing here is a real guard — there is no
 * backend and no session to protect — so the inner routes stay reachable
 * directly, which is what makes them easy to work on and demo.
 */
export default function App() {
  const { signedIn, toast, clearToast } = useAppState();

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to={signedIn ? '/discover' : '/login'} replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        <Route element={<AppShell />}>
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/events/:eventId" element={<EventDetailPage />} />
          <Route path="/spots/:spotId" element={<SpotDetailPage />} />
          <Route path="/chats" element={<EventChatPage />} />
          <Route path="/chats/:eventId" element={<EventChatPage />} />
          <Route path="/my-events" element={<MyEventsPage />} />
          <Route path="/profile" element={<ProfilePage own />} />
          <Route path="/artists/:userId" element={<ProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
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
