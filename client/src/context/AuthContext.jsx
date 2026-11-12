// Who is signed in. Gives signIn, signUp, signOut, updateProfile and deleteAccount to the whole app.
//
// On app start:
//   - no token saved      -> user = null (signed out)
//   - token saved         -> ask the server "who am I?" (GET /auth/me)
//                            OK  -> user is signed in
//                            401 -> token is old, remove it (signed out)
//                            other error -> keep the token, show Sign In (the user can try again)
// "checking" is true while we wait, so the app does not flash the wrong screen.
import { createContext, useContext, useEffect, useState } from 'react';
import * as api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(api.getToken()));

  function signOut() {
    api.clearToken();
    setUser(null);
  }

  useEffect(() => {
    // If any API call gets 401, sign out (for example, the token expired)
    api.setUnauthorizedHandler(signOut);

    if (!api.getToken()) return;
    api
      .getMe()
      .then((data) => setUser(data.user))
      .catch((err) => err.status === 401 && signOut()) // remove the token only if it is really invalid
      .finally(() => setChecking(false));
  }, []);

  // Save the token and the user after sign in / sign up
  function startSession({ token, user }) {
    api.saveToken(token);
    setUser(user);
  }

  const signIn = async (email, password) => startSession(await api.signIn(email, password));
  const signUp = async (name, email, password) => startSession(await api.signUp(name, email, password));

  // Profile actions
  async function updateProfile(name) {
    const data = await api.updateMe(name);
    setUser(data.user); // every screen shows the new name at once
  }

  async function deleteAccount() {
    await api.deleteMe(); // soft delete on the server
    signOut(); // then back to the public pages
  }

  const value = { user, checking, isSignedIn: !!user, signIn, signUp, signOut, updateProfile, deleteAccount };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
