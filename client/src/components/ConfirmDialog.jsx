// "Are you sure?" dialog for delete actions.
// One dialog for the whole app. Any component calls:
//   const ok = await confirm({ title, message, confirmText });
// and gets true (user tapped Delete) or false (Cancel).
import { Dialog, Typography } from '@mui/material';
import { DialogButtons } from './pickers/DialogParts';
import { useTasks } from '../context/TaskContext';

export default function ConfirmDialog() {
  const { confirmState, answerConfirm } = useTasks();
  const { open, title, message, confirmText } = confirmState;

  return (
    <Dialog open={open} onClose={() => answerConfirm(false)} fullWidth
      PaperProps={{ sx: { maxWidth: 340, m: 2, borderRadius: '2px' } }}>
      <Typography sx={{ fontSize: 15, fontWeight: 600, px: 2, pt: 2 }}>{title}</Typography>
      <Typography sx={{ fontSize: 13, color: '#6B6B70', px: 2, pt: 1, pb: 2.5 }}>{message}</Typography>
      <DialogButtons
        danger
        doneText={confirmText}
        onCancel={() => answerConfirm(false)}
        onDone={() => answerConfirm(true)}
      />
    </Dialog>
  );
}
