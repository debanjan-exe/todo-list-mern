// App logo for the loading screens: a white rounded square that "draws" a check mark,
// with a soft pulse ring around it. Pure SVG + CSS animations (no image files).
import { Box } from '@mui/material';
import { keyframes } from '@emotion/react';

const draw = keyframes`
  from { stroke-dashoffset: 40; }
  to   { stroke-dashoffset: 0; }
`;
const pulse = keyframes`
  0%   { transform: scale(1);   opacity: .45; }
  100% { transform: scale(1.7); opacity: 0; }
`;
const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
`;

export default function SplashLogo({ size = 84 }) {
  return (
    <Box sx={{ position: 'relative', width: size, height: size, animation: `${float} 3s ease-in-out infinite` }}>
      {/* pulse ring */}
      <Box sx={{ position: 'absolute', inset: 0, borderRadius: '22px', border: '2px solid rgba(255,255,255,.7)',
        animation: `${pulse} 1.8s ease-out infinite` }} />
      {/* logo */}
      <Box sx={{ position: 'absolute', inset: 0, borderRadius: '22px', bgcolor: '#fff', display: 'grid', placeItems: 'center',
        boxShadow: '0 12px 30px rgba(20, 30, 90, .35)' }}>
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="#4B66E1" strokeWidth="2" />
          {/* the tick "draws" itself once, after a short wait */}
          <Box component="path" d="M7.5 12.5l3 3 6-7" stroke="#4B66E1" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
            sx={{ strokeDasharray: 40, strokeDashoffset: 40, animation: `${draw} .7s .3s ease forwards` }} />
        </svg>
      </Box>
    </Box>
  );
}
