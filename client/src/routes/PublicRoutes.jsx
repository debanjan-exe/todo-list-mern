// Pages for users who are NOT signed in.
// Any other URL (for example /home) goes to the Sign In page.
// /oauth/authorize (Claude "Connect"): keep the request, sign in first, then PrivateRoutes opens it again.
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { savePendingOAuth } from '../api';
import Onboarding from '../pages/Onboarding';
import SignIn from '../pages/SignIn';
import SignUp from '../pages/SignUp';

function SignInFirst() {
  const { search } = useLocation();
  savePendingOAuth(search.replace(/^\?/, ''));
  return <Navigate to="/signin" replace />;
}

export default function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Onboarding />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/oauth/authorize" element={<SignInFirst />} />
      <Route path="*" element={<Navigate to="/signin" replace />} />
    </Routes>
  );
}
