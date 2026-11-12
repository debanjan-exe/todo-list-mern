// Sign Up screen: name + email + password -> POST /api/auth/signup.
// After success the user is signed in at once and sees Home.
import { useState } from 'react';
import AuthLayout, { AuthField } from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';

const EMAIL_RULE = /^\S+@\S+\.\S+$/;
const MIN_PASSWORD = 6; // same rule as the server

export default function SignUp() {
  const { signUp } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  // Change a field and remove its error (the user is fixing it)
  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setErrors({ ...errors, [field]: undefined });
    setApiError('');
  };

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!EMAIL_RULE.test(form.email.trim())) e.email = 'Enter a valid email';
    if (form.password.length < MIN_PASSWORD) e.password = `Use at least ${MIN_PASSWORD} characters`;
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      await signUp(form.name.trim(), form.email.trim(), form.password); // the page changes on success
    } catch (err) {
      setApiError(err.message); // for example "An account with this email already exists"
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create account"
      subtitle="Start planning your week"
      onSubmit={handleSubmit}
      submitText="Sign Up"
      loading={loading}
      apiError={apiError}
      footerText="Already have an account?"
      footerLink="Sign in"
      footerTo="/signin"
    >
      <AuthField label="Name" placeholder="Your name" autoComplete="name"
        value={form.name} onChange={update('name')} error={errors.name} />
      <AuthField label="Email" type="email" placeholder="you@example.com" autoComplete="email"
        value={form.email} onChange={update('email')} error={errors.email} />
      <AuthField label="Password" type="password" placeholder={`At least ${MIN_PASSWORD} characters`} autoComplete="new-password"
        value={form.password} onChange={update('password')} error={errors.password} />
      <AuthField label="Confirm password" type="password" placeholder="Type the password again" autoComplete="new-password"
        value={form.confirm} onChange={update('confirm')} error={errors.confirm} />
    </AuthLayout>
  );
}
