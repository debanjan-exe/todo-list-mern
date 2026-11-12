// Unit tests for the Mon-Sun week strip on Home.
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../renderWithProviders';
import WeekStrip from '../../src/components/WeekStrip';

const thursday = new Date(2026, 10, 12); // 12 Nov 2026

describe('WeekStrip', () => {
  it('shows the 7 days of the week, Monday first', () => {
    renderWithProviders(<WeekStrip selectedDate={thursday} onSelect={() => {}} />);
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    labels.forEach((day) => expect(screen.getByText(day)).toBeInTheDocument());
    expect(screen.getByText('09')).toBeInTheDocument(); // Monday 9
    expect(screen.getByText('15')).toBeInTheDocument(); // Sunday 15
  });

  it('selects the day that is tapped', async () => {
    const onSelect = vi.fn();
    renderWithProviders(<WeekStrip selectedDate={thursday} onSelect={onSelect} />);
    await userEvent.click(screen.getByText('14'));
    expect(onSelect.mock.calls[0][0].getDate()).toBe(14);
  });

  it('moves one week back and forward with the arrows', async () => {
    const onSelect = vi.fn();
    renderWithProviders(<WeekStrip selectedDate={thursday} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: 'Previous week' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next week' }));
    expect(onSelect.mock.calls[0][0].getDate()).toBe(5);
    expect(onSelect.mock.calls[1][0].getDate()).toBe(19);
  });
});
