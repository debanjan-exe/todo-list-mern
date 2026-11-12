// Starts React. Wraps the app with: MUI theme, date picker setup and the router.
// App.jsx adds the error page, the loading screen and the auth state.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/en-gb'; // en-gb = calendar weeks start on Monday
import theme from './theme';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Needed by the MUI date & time pickers (uses dayjs, weeks start Monday) */}
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
        {/* future flags = use React Router v7 behaviour now (removes console warnings) */}
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <App />
        </BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
  </React.StrictMode>
);
