// One week summary card: date range, open count, completed count.
// Click it to open (expand) and see all tasks of that week. Uses MUI Accordion.
import { Accordion, AccordionSummary, AccordionDetails, Box, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TaskItem from './TaskItem';
import { formatWeekRange, isInWeek } from '../utils/dateUtils';
import { colors } from '../theme';

function Count({ label, value, bg, color }) {
  return (
    <Box sx={{ bgcolor: bg, px: 1.25, py: 0.5, borderRadius: '2px' }}>
      <Typography sx={{ fontSize: 11, color }}>
        {label}: <b>{value}</b>
      </Typography>
    </Box>
  );
}

export default function WeekCard({ week, defaultExpanded }) {
  const thisWeek = isInWeek(new Date(), week.weekStart);
  const tasks = [...week.tasks].sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      elevation={0}
      sx={{ bgcolor: colors.pageBg, border: `1px solid ${colors.border}`, borderRadius: '2px', mb: 1.5, '&:before': { display: 'none' } }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box>
          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
            {formatWeekRange(week.weekStart)} {thisWeek && <Typography component="span" sx={{ fontSize: 11, color: colors.primary }}>(This Week)</Typography>}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Count label="Open" value={week.open} bg={colors.pendingBg} color={colors.pendingIcon} />
            <Count label="Completed" value={week.completed} bg={colors.completeBg} color={colors.primary} />
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        {tasks.map((task) => (
          <TaskItem key={task._id} task={task} showDate />
        ))}
      </AccordionDetails>
    </Accordion>
  );
}
