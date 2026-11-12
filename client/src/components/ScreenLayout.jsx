// Page layout used by Home, All Weeks, Search and Profile:
//   - the page is exactly one screen tall and never scrolls
//   - "header" stays fixed at the top
//   - "children" is the only part that scrolls
//   - the height leaves room for the bottom navigation bar
import { Box } from '@mui/material';
import { BOTTOM_NAV_HEIGHT } from './BottomNav';

export default function ScreenLayout({ header, children, bottomSpace = 12, pt = 3 }) {
  return (
    <Box sx={{ height: `calc(100dvh - ${BOTTOM_NAV_HEIGHT}px)`, display: 'flex', flexDirection: 'column', px: 2.5, pt }}>
      {/* Fixed top part */}
      <Box sx={{ flexShrink: 0 }}>{header}</Box>

      {/* Scrolling part */}
      <Box
        sx={{
          flex: 1, // take all the space that is left
          minHeight: 0, // needed so a flex child can scroll
          overflowY: 'auto',
          pb: bottomSpace, // space so the + button does not cover the last item
          mx: -2.5, px: 2.5, // keep the scrollbar at the edge of the screen
          scrollbarWidth: 'thin',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
