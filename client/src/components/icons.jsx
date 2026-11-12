// Thin outline icons that match the Figma design (trash + pencil in a square).
// Drawn with SVG paths inside MUI SvgIcon, so they size and color like MUI icons.
import { SvgIcon } from '@mui/material';

const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };

export function TrashIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path {...line} d="M4 6h16" /> {/* lid */}
      <path {...line} d="M9 6V4h6v2" /> {/* handle */}
      <path {...line} d="M6 6l1 14h10l1-14" /> {/* can */}
      <path {...line} d="M10 10v6M14 10v6" /> {/* lines on the can */}
    </SvgIcon>
  );
}

export function EditIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path {...line} d="M11 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6" /> {/* square */}
      <path {...line} d="M17.5 2.5a2.1 2.1 0 0 1 3 3L12 14l-4 1 1-4 8.5-8.5z" /> {/* pencil */}
    </SvgIcon>
  );
}
