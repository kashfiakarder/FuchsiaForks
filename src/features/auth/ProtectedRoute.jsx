import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

/**
 * Guards AppShell routes. Shows a short loading state while Auth0 resolves
 * so a refresh does not flash the login screen.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress aria-label="Checking sign-in" />
      </Box>
    );
  }

  if (!isAuthenticated) {
    loginWithRedirect({
      appState: { returnTo: location.pathname + location.search },
    });
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress aria-label="Redirecting to login" />
      </Box>
    );
  }

  return <Outlet />;
}

/** Send already-authenticated users away from /login and /signup. */
export function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress aria-label="Checking sign-in" />
      </Box>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/discover" replace />;
  }

  return children;
}
