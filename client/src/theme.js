// One place for all colors and fonts. Values are taken from the Figma design.
import { createTheme } from '@mui/material/styles';

export const colors = {
  primary: '#4B66E1', // buttons, selected day, FAB, checkbox
  primaryDark: '#2B3B93', // filled part of the progress bar
  primaryLight: '#DADBFA', // empty part of the progress bar
  text: '#1B1B1D',
  muted: '#A3A3A8', // day names, small labels
  border: '#E4E4E7',
  completeBg: '#EEF0FD', // "Task Complete" card
  pendingBg: '#FCE8E6', // "Task Pending" card
  pendingIcon: '#E35D5D',
  pageBg: '#FDFDFF',
};

const theme = createTheme({
  palette: {
    primary: { main: colors.primary },
    error: { main: colors.pendingIcon },
    text: { primary: colors.text, secondary: colors.muted },
    background: { default: '#F2F2F5', paper: '#FFFFFF' },
  },
  typography: {
    fontFamily: 'Poppins, sans-serif',
    button: { textTransform: 'none', fontWeight: 500 }, // Figma buttons are not uppercase
  },
  shape: { borderRadius: 4 },
});

export default theme;
