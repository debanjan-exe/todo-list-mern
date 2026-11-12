// Search screen (Figma "Frame 9"): back arrow, search box, matching tasks.
// The search runs on the server: GET /api/tasks?search=word
import { useEffect, useState } from 'react';
import { Box, TextField, InputAdornment, Typography, CircularProgress } from '@mui/material';
import TaskSkeleton from '../components/TaskSkeleton';
import SearchIcon from '@mui/icons-material/Search';
import BackHeader from '../components/BackHeader';
import TaskItem from '../components/TaskItem';
import ScreenLayout from '../components/ScreenLayout';
import { useTasks } from '../context/TaskContext';
import { searchTasks } from '../api';
import { colors } from '../theme';

export default function Search() {
  const { version } = useTasks(); // changes after add/edit/delete -> search again
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!keyword.trim()) {
      setResults([]);
      return;
    }
    // Wait 300 ms after the user stops typing, then call the API (this is "debounce")
    const timer = setTimeout(() => {
      setLoading(true);
      searchTasks(keyword)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword, version]);

  return (
    // Back arrow + search box are fixed; only the results scroll
    <ScreenLayout
      pt={2.5}
      bottomSpace={4}
      header={
        <>
          <BackHeader />

          <TextField
            fullWidth
            autoFocus
            placeholder="Search for a task"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            sx={{
              mt: 2,
              mb: 1,
              '& .MuiOutlinedInput-root': { borderRadius: '2px', fontSize: 13, bgcolor: '#fff' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {/* spinner in place of the search icon while searching */}
                  {loading ? <CircularProgress size={20} /> : <SearchIcon sx={{ color: '#1B1B1D' }} />}
                </InputAdornment>
              ),
            }}
            inputProps={{ 'aria-label': 'Search tasks' }}
          />
        </>
      }
    >
      {loading && <TaskSkeleton rows={3} />}

      {!loading && keyword.trim() && results.length === 0 && (
        <Typography sx={{ fontSize: 13, color: colors.muted, textAlign: 'center', mt: 3 }}>No tasks found</Typography>
      )}

      {!loading && results.map((task) => <TaskItem key={task._id} task={task} showDate />)}
    </ScreenLayout>
  );
}
