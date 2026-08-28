import { useState, useMemo } from 'react';
import { LeaveItem } from '../types';
import { getCalendarGrid, filterLeaves, isDateInLeave } from '../lib/schedule-utils';

export function useLeavesData(leaves: LeaveItem[] = []) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [leavesTab, setLeavesTab] = useState<'selected_day' | 'all_agenda'>('selected_day');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const calendarGrid = useMemo(
    () => getCalendarGrid(currentDate.getFullYear(), currentDate.getMonth(), leaves),
    [currentDate, leaves]
  );

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const jumpToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const filteredLeavesList = useMemo(() => {
    if (leavesTab === 'selected_day') {
      return leaves.filter(l => isDateInLeave(selectedDate, l));
    } else {
      let result = filterLeaves(leaves, 'all');
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        result = result.filter(l => 
          (l.doctorName || l.doctor || '').toLowerCase().includes(q) ||
          (l.reason || '').toLowerCase().includes(q) ||
          (l.replacementDoctor || '').toLowerCase().includes(q)
        );
      }
      return result;
    }
  }, [leaves, leavesTab, selectedDate, searchQuery]);

  return {
    currentDate,
    selectedDate,
    setSelectedDate,
    leavesTab,
    setLeavesTab,
    searchQuery,
    setSearchQuery,
    calendarGrid,
    prevMonth,
    nextMonth,
    jumpToToday,
    filteredLeavesList,
  };
}
