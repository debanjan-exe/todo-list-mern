// "View All" screen: one card per week (Mon-Sun) with open / completed counts.
// Tap a card to open it and see the tasks of that week.
// The back header is fixed; only the list of week cards scrolls.
import { Box, Typography, Skeleton } from '@mui/material';
import BackHeader from '../components/BackHeader';
import WeekCard from '../components/WeekCard';
import ScreenLayout from '../components/ScreenLayout';
import AddFab from '../components/AddFab';
import { useTasks } from '../context/TaskContext';
import { groupTasksByWeek, isInWeek } from '../utils/dateUtils';
import { colors } from '../theme';

export default function Weeks() {
  const { tasks, loading } = useTasks();
  const weeks = groupTasksByWeek(tasks);

  return (
    <>
      <ScreenLayout pt={2.5} header={<Box sx={{ pb: 2 }}><BackHeader title="All Weeks" /></Box>}>
        {/* Grey placeholder cards while tasks load */}
        {loading && [1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" height={84} sx={{ mb: 1.5 }} />
        ))}
        {!loading && weeks.length === 0 && (
          <Typography sx={{ fontSize: 13, color: colors.muted, textAlign: 'center', mt: 4 }}>No tasks yet</Typography>
        )}
        {weeks.map((week) => (
          <WeekCard
            key={week.weekStart.toISOString()}
            week={week}
            defaultExpanded={isInWeek(new Date(), week.weekStart)} // open the current week
          />
        ))}
      </ScreenLayout>

      <AddFab />
    </>
  );
}
