// One scroll wheel column (like the iPhone time picker).
// The list snaps to rows. The row in the middle is the selected value.
import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { colors } from '../../theme';

const ROW = 44; // height of one row in px
const VISIBLE = 5; // rows you can see (the middle one is selected)

export default function WheelColumn({ items, value, onChange, label }) {
  const ref = useRef(null);
  const timer = useRef(null);
  const index = Math.max(0, items.findIndex((i) => i.value === value));

  // Scroll to the selected row when the value changes from outside
  useEffect(() => {
    const el = ref.current;
    if (el && Math.round(el.scrollTop / ROW) !== index) {
      el.scrollTo({ top: index * ROW, behavior: 'smooth' });
    }
  }, [index]);

  // Stop the timer if the wheel is removed (dialog closed)
  useEffect(() => () => clearTimeout(timer.current), []);

  // When scrolling stops, select the row in the middle
  const handleScroll = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!ref.current) return; // the dialog was closed meanwhile
      const i = Math.round(ref.current.scrollTop / ROW);
      const item = items[Math.min(items.length - 1, Math.max(0, i))];
      if (item && item.value !== value) onChange(item.value);
    }, 80);
  };

  return (
    <Box
      ref={ref}
      onScroll={handleScroll}
      role="listbox"
      aria-label={label}
      sx={{
        flex: 1,
        height: ROW * VISIBLE,
        overflowY: 'auto',
        scrollSnapType: 'y mandatory',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
        py: `${ROW * 2}px`, // empty space so the first and last rows can reach the middle
        position: 'relative',
        zIndex: 1,
        // fade out rows at the top and bottom
        maskImage: 'linear-gradient(transparent, #000 35%, #000 65%, transparent)',
      }}
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <Box
            key={item.value}
            role="option"
            aria-selected={selected}
            onClick={() => onChange(item.value)}
            sx={{
              height: ROW,
              scrollSnapAlign: 'center',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              fontSize: selected ? 22 : 17,
              fontWeight: selected ? 600 : 400,
              color: selected ? colors.primary : colors.muted,
              transition: 'all .15s',
            }}
          >
            {item.label}
          </Box>
        );
      })}
    </Box>
  );
}

export { ROW, VISIBLE };
