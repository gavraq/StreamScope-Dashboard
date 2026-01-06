import React from 'react';
import { WatchedVideo } from '../types';
import { format, eachDayOfInterval, getDay } from 'date-fns';

interface ActivityHeatmapProps {
  history: WatchedVideo[];
}

const ActivityHeatmap = ({ history }: ActivityHeatmapProps) => {
  // Generate last 365 days
  const today = new Date();
  
  // Calculate start date (364 days ago)
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 364);
  
  const dates = eachDayOfInterval({
    start: startDate,
    end: today
  });

  // Map history to dictionary for O(1) lookup
  const activityMap: Record<string, number> = {};
  history.forEach(v => {
    // v.watchedDate is YYYY-MM-DD
    activityMap[v.watchedDate] = (activityMap[v.watchedDate] || 0) + 1;
  });

  // Determine intensity color - GitHub Green Style
  const getColor = (count: number) => {
    if (count === 0) return 'bg-[#1f1f1f]'; // Empty
    if (count <= 2) return 'bg-emerald-900/60'; // Low
    if (count <= 5) return 'bg-emerald-700/80'; // Medium
    if (count <= 8) return 'bg-emerald-600';    // High
    return 'bg-emerald-500';                    // Very High
  };

  // Group by weeks for grid layout
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  
  // Pad first week with nulls (invalid dates)
  const startDay = getDay(startDate); // 0 (Sun) to 6 (Sat)
  for (let i = 0; i < startDay; i++) {
    // We use a specific invalid date marker
    currentWeek.push(new Date(0)); 
  }

  dates.forEach(date => {
    currentWeek.push(date);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  
  // Push remaining days
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex gap-1 min-w-max">
        {weeks.map((week, weekIdx) => (
          <div key={`week-${weekIdx}`} className="flex flex-col gap-1">
            {week.map((date, dayIdx) => {
               // Render placeholder if invalid date (Epoch 0)
               if (date.getTime() === 0) {
                 return <div key={`placeholder-${weekIdx}-${dayIdx}`} className="w-3 h-3" />;
               }
               
               const dateStr = format(date, 'yyyy-MM-dd');
               const count = activityMap[dateStr] || 0;
               
               return (
                 <div 
                   key={dateStr}
                   className={`w-3 h-3 rounded-sm ${getColor(count)} transition-all hover:ring-1 hover:ring-white relative group`}
                 >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-700 shadow-xl pointer-events-none">
                        {format(date, 'MMM do, yyyy')}: {count} videos
                    </div>
                 </div>
               );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 mt-2 text-xs text-gray-500">
        <span>Less</span>
        <div className="w-3 h-3 bg-[#1f1f1f] rounded-sm" />
        <div className="w-3 h-3 bg-emerald-900/60 rounded-sm" />
        <div className="w-3 h-3 bg-emerald-700/80 rounded-sm" />
        <div className="w-3 h-3 bg-emerald-600 rounded-sm" />
        <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
        <span>More</span>
      </div>
    </div>
  );
};

export default ActivityHeatmap;