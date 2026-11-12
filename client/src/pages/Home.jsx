// Home screen (same layout as Figma):
// search bar, week strip, Complete/Pending cards, weekly progress, tasks of the selected day, + button.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, LinearProgress, Link, Skeleton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import WeekStrip from '../components/WeekStrip';
import SummaryCards from '../components/SummaryCards';
import TaskItem from '../components/TaskItem';
import TaskSkeleton from '../components/TaskSkeleton';
import ScreenLayout from '../components/ScreenLayout';
import AddFab from '../components/AddFab';
import { useTasks } from '../context/TaskContext';
import { isInWeek, isSameDay } from '../utils/dateUtils';
import { colors } from '../theme';

export default function Home() {
  const navigate = useNavigate();
  const { tasks, loading, error } = useTasks();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Tasks of the selected week -> numbers for the cards and the progress bar
  const weekTasks = tasks.filter((t) => isInWeek(t.dateTime, selectedDate));
  const completed = weekTasks.filter((t) => t.status === 'Completed').length;
  const pending = weekTasks.length - completed;
  const progress = weekTasks.length ? (completed / weekTasks.length) * 100 : 0;

  // Tasks of the selected day, sorted by time
  const dayTasks = tasks.filter((t) => isSameDay(t.dateTime, selectedDate)).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

  const isToday = isSameDay(selectedDate, new Date());
  const listTitle = isToday
    ? 'Tasks Today'
    : `Tasks on ${selectedDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}`;

  return (
    <>
      {/* Top part is fixed; only the task list scrolls (see ScreenLayout) */}
      <ScreenLayout
        header={
          <>
            {/* Search bar: tap it to open the Search page */}
            <Box
              onClick={() => navigate('/search')}
              role="button"
              aria-label="Search for a task"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: `1px solid ${colors.border}`,
                bgcolor: '#fff',
                px: 1.5,
                py: 1.1,
                cursor: 'pointer',
                borderRadius: '2px',
              }}
            >
              <Typography sx={{ fontSize: 12, color: colors.muted }}>Search for a task</Typography>
              <SearchIcon sx={{ fontSize: 20 }} />
            </Box>

            <WeekStrip selectedDate={selectedDate} onSelect={setSelectedDate} />

            <SummaryCards completed={completed} pending={pending} loading={loading} />

            {/* Weekly progress bar */}
            <Typography sx={{ fontSize: 16, fontWeight: 600, mt: 3, mb: 1.5 }}>Weekly Progress</Typography>
            {loading ? (
              <Skeleton variant="rectangular" height={14} />
            ) : (
              <LinearProgress
                variant="determinate"
                value={progress}
                aria-label="Weekly progress"
                sx={{
                  height: 14,
                  borderRadius: 0,
                  bgcolor: colors.primaryLight,
                  '& .MuiLinearProgress-bar': { bgcolor: colors.primaryDark },
                }}
              />
            )}

            {/* Task list header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3.5, mb: 0.5 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 600 }}>{listTitle}</Typography>
              <Link component="button" underline="none" onClick={() => navigate('/weeks')} sx={{ fontSize: 12 }}>
                View All
              </Link>
            </Box>
          </>
        }
      >
        {loading && <TaskSkeleton rows={4} />}
        {error && (
          <Typography color="error" sx={{ fontSize: 13, mt: 2 }}>
            Could not load tasks: {error}
          </Typography>
        )}
        {!loading && !error && dayTasks.length === 0 && (
          <Typography sx={{ fontSize: 13, color: colors.muted, mt: 2, textAlign: 'center' }}>
            No tasks for this day. Tap + to add one.
          </Typography>
        )}
        {dayTasks.map((task) => (
          <TaskItem key={task._id} task={task} />
        ))}
      </ScreenLayout>

      {/* Round + button (above the bottom nav). New tasks get the selected day. */}
      <AddFab date={selectedDate} />
    </>
  );
}
