// Shared parts of the picker dialogs:
//   DialogTitleRow -> title at the top left
//   DialogButtons  -> Cancel and Done at the bottom right
import { Box, Button, Typography } from '@mui/material';
import { colors } from '../../theme';

export function DialogTitleRow({ title }) {
  return (
    <Typography sx={{ fontSize: 15, fontWeight: 600, px: 2, pt: 2, pb: 1.5 }}>{title}</Typography>
  );
}

// danger = red main button (used for Delete)
export function DialogButtons({ onCancel, onDone, doneText = 'Done', danger = false }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, px: 2, pb: 2 }}>
      <Button onClick={onCancel} sx={{ color: colors.muted }}>Cancel</Button>
      <Button onClick={onDone} variant="contained" disableElevation color={danger ? 'error' : 'primary'}
        sx={{ borderRadius: '2px', px: 3 }}>
        {doneText}
      </Button>
    </Box>
  );
}
