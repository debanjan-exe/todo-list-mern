// Pages for users who are NOT signed in.
// Any other URL (for example /home) goes to the Sign In page.
import { Routes, Route, Navigate } from 'react-router-dom';
import Onboarding from '../pages/Onboarding';
import SignIn from '../pages/SignIn';
import SignUp from '../pages/SignUp';

export default function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Onboarding />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="*" element={<Navigate to="/signin" replace />} />
    </Routes>
  );
}
