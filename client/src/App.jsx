// The app inside a phone-width frame. Order on start:
//   1. ErrorBoundary  - if any screen crashes, show "Something went wrong"
//   2. ServerGate     - loading screen: check the server, database, sign in, test user
//   3. AuthProvider   - who is signed in (runs only after the server is OK)
//   4. AppRoutes      - routes/index.jsx: PrivateRoutes or PublicRoutes
import MobileFrame from './components/MobileFrame';
import ErrorBoundary from './components/ErrorBoundary';
import ServerGate from './components/startup/ServerGate';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes';

export default function App() {
  return (
    <MobileFrame>
      <ErrorBoundary>
        <ServerGate>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ServerGate>
      </ErrorBoundary>
    </MobileFrame>
  );
}
