// Sign In screen: email + password -> POST /api/auth/signin.
// After success, AuthContext has a user, and routes/index.jsx shows the private pages.
import { useEffect, useState } from 'react';
import { Alert } from '@mui/material';
import { getTestUser } from '../api';
import AuthLayout, { AuthField } from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';

const EMAIL_RULE = /^\S+@\S+\.\S+$/;

export default function SignIn() {
  const { signIn } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usingTestUser, setUsingTestUser] = useState(false);

  // Fill in the demo account from the server (GET /api/auth/test-user).
  // Only if the user has not typed anything yet. No account? Nothing happens.
  useEffect(() => {
    getTestUser()
      .then(({ email, password }) => {
        setForm((f) => (f.email || f.password ? f : { email, password }));
        setUsingTestUser(true);
      })
      .catch(() => {}); // test user turned off on the server
  }, []);

  // Change a field and remove its error (the user is fixing it)
  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setErrors({ ...errors, [field]: undefined });
    setApiError('');
  };

  function validate() {
    const e = {};
    if (!EMAIL_RULE.test(form.email.trim())) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      await signIn(form.email.trim(), form.password); // the page changes on success
    } catch (err) {
      setApiError(err.message);
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to manage what you have to do"
      onSubmit={handleSubmit}
      submitText="Sign In"
      loading={loading}
      apiError={apiError}
      footerText="New here?"
      footerLink="Create an account"
      footerTo="/signup"
    >
      {usingTestUser && (
        <Alert severity="info" sx={{ mt: 2.5, borderRadius: '2px', fontSize: 12, py: 0.25 }}>
          Test account filled in. Tap <b>Sign In</b>, or type your own details.
        </Alert>
      )}
      <AuthField label="Email" type="email" placeholder="you@example.com" autoComplete="email"
        value={form.email} onChange={update('email')} error={errors.email} />
      <AuthField label="Password" type="password" placeholder="Your password" autoComplete="current-password"
        value={form.password} onChange={update('password')} error={errors.password} />
    </AuthLayout>
  );
}
