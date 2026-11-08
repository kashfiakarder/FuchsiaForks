import { Auth0Provider } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

/**
 * Auth0Provider that returns to an in-app route after Universal Login.
 * Must render inside BrowserRouter so useNavigate works.
 */
export default function Auth0ProviderWithNavigate({ children }) {
  const navigate = useNavigate();

  const domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

  if (!domain || !clientId) {
    // eslint-disable-next-line no-console
    console.warn(
      'Auth0 is not configured. Set VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID in .env',
    );
  }

  return (
    <Auth0Provider
      domain={domain || 'not-configured.auth0.com'}
      clientId={clientId || 'not-configured'}
      authorizationParams={{
        redirect_uri: window.location.origin,
        ...(audience ? { audience } : {}),
      }}
      onRedirectCallback={(appState) => {
        navigate(appState?.returnTo || '/discover', { replace: true });
      }}
    >
      {children}
    </Auth0Provider>
  );
}
