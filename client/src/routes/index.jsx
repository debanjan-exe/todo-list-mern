// Entry point for all routes.
// It checks if the user is signed in and shows ONE of two route groups:
//   signed in  -> PrivateRoutes (Home, All Weeks, Search)
//   signed out -> PublicRoutes  (Onboarding, Sign In, Sign Up)
// A signed-out user cannot open a private page: the private routes are not even mounted.
import { useAuth } from '../context/AuthContext';
import PrivateRoutes from './PrivateRoutes';
import PublicRoutes from './PublicRoutes';
import { Box } from '@mui/material';

export default function AppRoutes() {
  const { isSignedIn, checking } = useAuth();

  // Wait while we check a saved sign-in with the server (usually a few milliseconds).
  // A plain page, so the loading screen does not flash again on every reload.
  if (checking) return <Box sx={{ minHeight: '100dvh' }} />;

  return isSignedIn ? <PrivateRoutes /> : <PublicRoutes />;
}
