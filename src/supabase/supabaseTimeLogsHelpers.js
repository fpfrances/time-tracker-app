/*


// UNCOMMENT THIS SNIPPET AND PLACE IN TO PRINT LAST WEEK REPORT BUTTON
import { supabase } from "../supabaseClient";

export const getLastWeekLogs = async (userId, userTimezone) => {
  const now = new Date();
  const day = now.getDay() || 7;

  // Start of current week
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - day + 1);
  startOfThisWeek.setHours(0, 0, 0, 0);

  // Start of last week
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  // End of last week
  const endOfLastWeek = new Date(startOfThisWeek);
  endOfLastWeek.setDate(endOfLastWeek.getDate() - 1);
  endOfLastWeek.setHours(23, 59, 59, 999);

  const startISO = startOfLastWeek.toISOString();
  const endISO = endOfLastWeek.toISOString();

  const { data, error } = await supabase
    .from('time_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('clock_in', startISO)
    .lte('clock_out', endISO);

  if (error) {
    console.error('Error fetching last week logs:', error);
    return [];
  }

  return {
    logs: data,
    weekRange: `${startOfLastWeek.toLocaleDateString()} - ${endOfLastWeek.toLocaleDateString()}`,
  };
};


// ADD THIS IMPORT TO DASHBOARD.JSX
import { getLastWeekLogs } from '../../supabase/supabaseTimeLogsHelpers';


// SUBSTITUTE THIS SNIPPET INTO DASHBOARD.JSX WHERE INDICATED TO PRINT LAST WEEK REPORT BUTTON
<button
  className="px-3 py-2 mb-5 bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold rounded-lg shadow-white shadow-md animate-pulse transition duration-300 cursor-pointer"
  onClick={async () => {
    if (!user) return;

    const { logs, weekRange } = await getLastWeekLogs(user.id, userTimezone);

    const tempWeeklyLog = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    const tempDailyNotes = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] };

    logs.forEach((log) => {
      if (!log.clock_in || !log.clock_out) return;

      const clockInLocal = new Date(
        new Date(log.clock_in).toLocaleString('en-US', { timeZone: userTimezone })
      );
      const clockOutLocal = new Date(
        new Date(log.clock_out).toLocaleString('en-US', { timeZone: userTimezone })
      );

      const dayKey = clockInLocal.toLocaleDateString('en-US', { weekday: 'short' });
      const durationHrs = (clockOutLocal - clockInLocal) / (1000 * 60 * 60);

      if (tempWeeklyLog[dayKey] !== undefined) tempWeeklyLog[dayKey] += durationHrs;
      if (log.note) tempDailyNotes[dayKey].push(log.note);
    });

    generateWeeklyPDF(tempWeeklyLog, tempDailyNotes, userTimezone, weekRange, user);
  }}
>
  Download Last Week Report
</button>



*/