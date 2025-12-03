import { useEffect, useState } from 'react';
import { RevealOnScroll } from '../RevealOnScroll';
import { supabase } from '../../supabaseClient';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { getWeeklyLogs, getMonthlyLogs } from '../../supabase/supabaseTimeLogs';
import { generateWeeklyPDF } from '../../utils/generateWeeklyReport';
import { generateMonthlyPDF } from '../../utils/generateMonthlyReport';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { saveAs } from 'file-saver';

// Basic Modal Component
const NoteModal = ({ open, note, setNote, onSave, onCancel }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white p-6 rounded-lg w-[90%] max-w-md">
        <h2 className="text-lg text-black font-semibold mb-2">
          What did you work on today?
        </h2>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 75))}
          className="w-full text-black p-2 border border-gray-300 rounded mb-4"
          rows={3}
          maxLength={75}
          placeholder="Max 75 characters..."
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [clockInTime, setClockInTime] = useState(null);
  const [clockOutTime, setClockOutTime] = useState(null);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [weeklyLog, setWeeklyLog] = useState({});
  const [lastDailyNotes, setLastDailyNotes] = useState({});      // for UI
  const [dailyNotes, setDailyNotes] = useState({});               // for PDF
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [currentDayKey, setCurrentDayKey] = useState('');
  const [activeLogId, setActiveLogId] = useState(null);
  const [isLockingClockIn, setIsLockingClockIn] = useState(false);
  const [monthlyLogsByWeek, setMonthlyLogsByWeek] = useState({});

  // Get user's timezone and current week range for weekly report
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  const startOfWeek = new Date(now);
  const day = now.getDay() || 7;
  startOfWeek.setDate(now.getDate() - day + 1);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const weekRange = `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;

  const weekdayMap = {
    Mon: 'Monday',
    Tue: 'Tuesday',
    Wed: 'Wednesday',
    Thu: 'Thursday',
    Fri: 'Friday',
    Sat: 'Saturday',
    Sun: 'Sunday',
  };

  const getDayKey = (date) => {
    const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, ...
    const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return dayMap[dayIndex];
  };

  const handleClockIn = async () => {
    if (isClockedIn || isLockingClockIn) return;

    setIsLockingClockIn(true);
    const now = new Date();
    const localTime = getLocalISOString(now);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    const { data, error } = await supabase
      .from('time_logs')
      .insert([
        {
          user_id: user.id,
          clock_in: localTime, // local time string
          timezone, // e.g., "America/New_York"
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error during clock-in:', error);
      setIsLockingClockIn(false); // unlock on failure
      return;
    }

    setClockInTime(localTime);
    setIsClockedIn(true);
    setClockOutTime(null);
    setActiveLogId(data.id);
    setIsLockingClockIn(false); // unlock after success
  };

  const handleClockOut = async () => {
    if (!isClockedIn || clockOutTime) return;

    const now = new Date();
    const localTime = getLocalISOString(now);
    const durationMs = now - new Date(clockInTime);
    const durationHrs = durationMs / (1000 * 60 * 60);
    const dayKey = getDayKey(now);

    setWeeklyLog((prev) => ({
      ...prev,
      [dayKey]: parseFloat((prev[dayKey] + durationHrs).toFixed(2)),
    }));

    const { error } = await supabase
      .from('time_logs')
      .update({ clock_out: localTime })
      .eq('id', activeLogId);

    if (error) {
      console.error('Error updating clock-out:', error);
      return;
    }

    setCurrentDayKey(dayKey);
    setNoteDraft('');
    setNoteModalOpen(true);
    setClockOutTime(localTime);
    setIsClockedIn(false);
  };

  const handleSaveNote = async () => {
    if (!currentDayKey || !clockInTime || !clockOutTime) {
      setNoteModalOpen(false);
      return;
    }

    try {
      if (!activeLogId) {
        console.error('No active log ID found for update.');
        return;
      }

      const { error } = await supabase
        .from('time_logs')
        .update({
          note: noteDraft,
        })
        .eq('id', activeLogId);

      if (error) {
        console.error('Failed to update time log:', error);
      } else {
        // Update dailyNotes state with new note for immediate UI update
        setLastDailyNotes((prev) => ({
          ...prev,
          [currentDayKey]: noteDraft,
        }));

        // Reset clock times & active log AFTER saving note
        setClockInTime(null);
        setIsClockedIn(false);
        setActiveLogId(null);
      }
    } catch (err) {
      console.error('Unexpected error updating time log:', err);
    }

    setNoteModalOpen(false);
  };

  const getLocalISOString = (date = new Date()) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
      date.getSeconds()
    )}`;
  };

  const totalHours = Object.entries(weeklyLog)
    .filter(([day]) => weekdayMap[day]) // only valid weekdays
    .reduce((sum, [, h]) => sum + h, 0)
    .toFixed(2);

  const chartData = Object.entries(weeklyLog).map(([key, value]) => ({
    day: weekdayMap[key],
    hours: parseFloat(value.toFixed(2)),
  }));

  useEffect(() => {
    let interval;

    // Function to fetch open log and auto clock-out if needed
    const handleAutoClockOut = async (userId) => {
      try {
        const { data: openLog, error: openLogError } = await supabase
          .from('time_logs')
          .select('*')
          .eq('user_id', userId)
          .is('clock_out', null)
          .order('clock_in', { ascending: false })
          .limit(1)
          .single();

        if (openLogError) {
          console.error('Error fetching open log:', openLogError);
          return null;
        }

        if (!openLog) {
          // No open log found, reset clock-in state
          setIsClockedIn(false);
          setClockInTime(null);
          setActiveLogId(null);
          return null;
        }

        const clockInDate = new Date(openLog.clock_in);
        const nowUTC = new Date();
        const durationMs = nowUTC - clockInDate;
        const maxShiftMs = 8 * 60 * 60 * 1000; // 8 hours shift in milliseconds

        if (durationMs >= maxShiftMs) {
          // Auto clock-out time: exactly 8 hours after clock-in
          const autoClockOut = new Date(clockInDate.getTime() + maxShiftMs);

          const isoClockOut = getLocalISOString(autoClockOut);

          const { error: updateError } = await supabase
            .from('time_logs')
            .update({
              clock_out: isoClockOut,
              note: '[Auto clock-out after 8 hours shift]',
            })
            .eq('id', openLog.id);

          if (updateError) {
            console.error('Failed auto clock-out:', updateError);
            return null;
          }

          // Clear clock-in state after auto clock-out
          setIsClockedIn(false);
          setClockInTime(null);
          setActiveLogId(null);

          return true;
        } else {
          // Still within allowed shift time, keep clock-in state
          setIsClockedIn(true);
          setClockInTime(openLog.clock_in);
          setActiveLogId(openLog.id);
          return false;
        }
      } catch (error) {
        console.error('Error in handleAutoClockOut:', error);
        return null;
      }
    };

    const getUserAndLogs = async () => {
      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();
        if (!authData?.user) {
          console.error('User not found', authError);
          return;
        }

        const user = authData.user;
        setUser(user);

        // Fetch user profile from the `users` table using auth ID
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
        } else {
          setUser((prev) => ({ ...prev, name: userProfile.name }));
        }

        const userTimeZone =
          Intl.DateTimeFormat().resolvedOptions().timeZone ||
          'America/New_York';
        const now = new Date();
        const localNow = new Date(
          now.toLocaleString('en-US', { timeZone: userTimeZone })
        );
        const day = localNow.getDay() || 7;
        const startOfWeekLocal = new Date(
          localNow.getFullYear(),
          localNow.getMonth(),
          localNow.getDate() - day + 1
        );
        const weekStartUTC = startOfWeekLocal.toISOString();

        // Run auto clock-out check, await result
        await handleAutoClockOut(user.id);

        // Whether or not auto clock-out happened, fetch fresh weekly logs
        const weekly = await getWeeklyLogs(user.id, weekStartUTC);

        // Prepare weekly logs and notes as before
        const tempWeeklyLog = {
          Mon: 0,
          Tue: 0,
          Wed: 0,
          Thu: 0,
          Fri: 0,
          Sat: 0,
          Sun: 0,
        };

        // Initialize last notes for UI display
        const tempLastNotes = {
          Mon: '',
          Tue: '',
          Wed: '',
          Thu: '',
          Fri: '',
          Sat: '',
          Sun: '',
        };

        // Initialize daily notes array for PDF generation
        const tempDailyNotes = {
          Mon: [],
          Tue: [],
          Wed: [],
          Thu: [],
          Fri: [],
          Sat: [],
          Sun: [],
        };

        weekly.forEach((log) => {
          const clockOut = log.clock_out || log.clockOutTime;
          // ✅ Only skip logs that are actively in-progress
          if (!clockOut) return;

          const logTime = log.clockOutTime || log.clockInTime || log.clock_out;
          const localDateStr = new Date(logTime).toLocaleString('en-US', {
            timeZone: userTimeZone,
          });
          const localDate = new Date(localDateStr);
          const dayKey = localDate.toLocaleDateString('en-US', {
            weekday: 'short',
          });
          tempWeeklyLog[dayKey] += parseFloat(log.duration || 0);

          if(log.note) {
          tempDailyNotes[dayKey].push(log.note);
          tempLastNotes[dayKey] = log.note || '';
          }
        });

        setWeeklyLog(tempWeeklyLog);
        setDailyNotes(tempDailyNotes);        // for PDF
        setLastDailyNotes(tempLastNotes);     // for UI

        // Get monthly logs
        const year = localNow.getFullYear();
        const month = localNow.getMonth() + 1; // JavaScript months are 0-based
        const monthly = await getMonthlyLogs(user.id, year, month);

        // Initialize containers for monthly logs and notes grouped by week
        const monthlyLogsByWeek = {};
        const dailyNotesByWeek = {};

        // Helper: Format date as MM/DD/YYYY
        const formatDate = (d) => {
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          const yyyy = d.getFullYear();
          return `${mm}/${dd}/${yyyy}`;
        };

        // Convert a date to start of week (Monday)
        const getStartOfWeek = (date) => {
          const day = date.getDay() || 7; // Sunday = 0, treat as 7
          const start = new Date(date);
          start.setDate(date.getDate() - day + 1);
          start.setHours(0, 0, 0, 0);
          return start;
        };

        // Process each log
        monthly.forEach((log) => {
          // Convert clock_in to local date, using same approach as weekly logs
          const logTime = log.clock_in || log.clockOutTime || log.clockInTime;
          const localDateStr = new Date(logTime).toLocaleString('en-US', {
            timeZone: userTimeZone,
          });
          const localDate = new Date(localDateStr);

          // Calculate start and end of week (Mon-Sun)
          const startOfWeek = getStartOfWeek(localDate);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);

          // Week key as string range "MM/DD/YYYY - MM/DD/YYYY"
          const weekKey = `${formatDate(startOfWeek)} - ${formatDate(
            endOfWeek
          )}`;

          // Group logs by week key
          if (!monthlyLogsByWeek[weekKey]) monthlyLogsByWeek[weekKey] = [];
          monthlyLogsByWeek[weekKey].push(log);

          // Group notes by week key and day (weekday short)
          if (!dailyNotesByWeek[weekKey]) dailyNotesByWeek[weekKey] = {};

          const dayKey = localDate.toLocaleDateString('en-US', {
            weekday: 'short',
          });

          if (!dailyNotesByWeek[weekKey][dayKey])
            dailyNotesByWeek[weekKey][dayKey] = [];

          dailyNotesByWeek[weekKey][dayKey] = log.note || '';
        });

        setMonthlyLogsByWeek(monthlyLogsByWeek);
      } catch (error) {
        console.error('Failed to load logs:', error);
      }
    };

    const getWeekNumber = (date) => {
      const d = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
      );
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    };

    const resetWeeklyData = () => {
      setWeeklyLog({ Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 });
      setLastDailyNotes({
        Mon: '',
        Tue: '',
        Wed: '',
        Thu: '',
        Fri: '',
        Sat: '',
        Sun: '',
      });
      setClockInTime(null);
      setClockOutTime(null);
      setIsClockedIn(false);
    };

    const checkWeeklyReset = () => {
      const now = new Date();
      const isSunday = now.getDay() === 0;
      const isLateSunday =
        isSunday && now.getHours() === 23 && now.getMinutes() >= 59;
      const lastReset = localStorage.getItem('lastWeeklyReset');
      const lastResetDate = lastReset ? new Date(lastReset) : null;
      const shouldReset =
        isLateSunday &&
        (!lastResetDate || getWeekNumber(now) !== getWeekNumber(lastResetDate));

      if (shouldReset) {
        resetWeeklyData();
        localStorage.setItem('lastWeeklyReset', now.toISOString());
      }
    };

    getUserAndLogs();
    checkWeeklyReset();

    interval = setInterval(checkWeeklyReset, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await supabase.auth.signOut();
      window.location.replace('/');
    }
  };

  return (
    <>
      <NoteModal
        open={noteModalOpen}
        note={noteDraft}
        setNote={setNoteDraft}
        onSave={handleSaveNote}
        onCancel={() => setNoteModalOpen(false)}
      />
      <section
        id="home"
        className="w-full mx-auto px-0 py-10 max-w-md sm:max-w-xl md:max-w-4xl lg:max-w-4xl"
      >
        <RevealOnScroll>
          <div className="z-10 px-2 mb-5">
            <h1 className="masked-text text-5xl font-bold mb-20">
              Welcome to your Dashboard
            </h1>
            <div className="flex justify-between items-center">
              {user && (
                <p className="text-lg text-white">
                  Hello, {user?.name || user?.email}!
                </p>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold rounded-lg shadow-white shadow-md animate-pulse transition duration-300 cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Weekly Overview */}
          <div className="w-full bg-gradient-to-r from-purple-500 to-blue-600 transition-all duration-500 px-6 py-8 rounded-lg shadow-md mb-6">
            <div className="flex flex-col md:flex-row items-center justify-between w-full">
              {/* Left: Daily Breakdown */}
              <div className="max-w-[300px] sm:max-w-[400px] md:max-w-[300px] lg:max-w-[350px] text-white break-words">
                <h2 className="text-xl font-semibold text-white mb-3 text-center">
                  This week you've tracked
                </h2>
                <ul className="list-inside text-left space-y-1">
                  {Object.entries(lastDailyNotes).map(([key, note]) =>
                    note ? (
                      <li key={key} className="break-words">
                        <strong>{weekdayMap[key]}:</strong>
                        <span className="ml-1 text-sm text-white/90 italic break-words">
                          {note.length > 100 ? `${note.slice(0, 100)}…` : note}
                        </span>
                      </li>
                    ) : null
                  )}
                </ul>
              </div>

              {/* Right: Bar Chart */}
              <div className="md:w-1/2 w-full flex flex-col items-center mt-2">
                <h2 className="text-xl font-semibold text-white text-center">
                  Weekly hours
                </h2>
                <div className="w-full h-[250px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 25, right: 15, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="0 1" stroke="#ccc" />
                      <XAxis
                        hide={false}
                        axisLine={false}
                        tickLine={false}
                        tick={false}
                        label={{
                          value: 'Day',
                          position: 'insideBottom',
                          offset: 10,
                          style: { fill: 'white', fontSize: 14 },
                        }}
                      />
                      <YAxis
                        hide={false}
                        axisLine={false}
                        tickLine={false}
                        tick={false}
                        label={{
                          value: 'Hours',
                          angle: -90,
                          position: 'insideLeft',
                          offset: 50,
                          style: { fill: 'white', fontSize: 14 },
                        }}
                      />
                      <Bar
                        dataKey="hours"
                        fill="white"
                        isAnimationActive={false}
                        label={{
                          position: 'top',
                          fill: '#fff',
                          fontSize: 12,
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Cards */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Clock Controls */}
            <div className="bg-gradient-to-r from-purple-500 to-blue-600 transition-all duration-500 py-14 p-20 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4 text-white">
                Clock In / Out
              </h3>
              <div className="flex flex-col space-y-4">
                <button
                  onClick={handleClockIn}
                  disabled={isClockedIn || isLockingClockIn}
                  className={`py-2 rounded font-semibold transition ${
                    isClockedIn
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-white text-purple-600 hover:bg-purple-100 cursor-pointer'
                  }`}
                >
                  Clock In
                </button>
                {clockInTime && (
                  <p className="text-white">
                    Clocked in at: {new Date(clockInTime).toLocaleTimeString()}
                  </p>
                )}

                <button
                  onClick={handleClockOut}
                  disabled={!isClockedIn || !!clockOutTime}
                  className={`py-2 rounded font-semibold transition ${
                    !isClockedIn || clockOutTime
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-white text-purple-600 hover:bg-purple-100 cursor-pointer'
                  }`}
                >
                  Clock Out
                </button>
                {clockOutTime && (
                  <p className="text-white">
                    Clocked out at:{' '}
                    {new Date(clockOutTime).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>

            {/* Total Weekly Hours & Daily Breakdown */}
            <div className="bg-gradient-to-r from-purple-500 to-blue-600 transition-all duration-500 py-10 p-10 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4 text-white">
                Weekly Overview
              </h3>
              <ul className="list-inside text-white text-center">
                {Object.entries(weeklyLog)
                  .filter(([day]) => weekdayMap[day])
                  .map(([key, value]) => (
                    <li key={key}>
                      {weekdayMap[key]}: {value.toFixed(2)} hrs
                    </li>
                  ))}
              </ul>
              <p className="text-white mt-4">
                You've worked a total of {totalHours} hours this week.
              </p>
            </div>
          </div>
          {/* Download your monthly/weekly report */}
          <div className="w-full mt-6 bg-gradient-to-r from-purple-500 to-blue-600 transition-all duration-500 px-6 py-6 rounded-lg shadow-md mb-6">
            <div className="flex flex-col md:flex-row items-center justify-between w-full">
              <div className="max-w-[300px] sm:max-w-[400px] md:max-w-[300px] lg:max-w-[350px] text-white break-words">
                <h2 className="text-xl font-semibold text-white text-center justify-center mb-4">
                  Download your weekly/monthly report
                </h2>
              </div>
              <div className="md:w-1/2 w-full flex flex-col items-center justify-left">
                <button
                  className="px-3 py-2 mb-5 bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold rounded-lg shadow-white shadow-md animate-pulse transition duration-300 cursor-pointer"
                  onClick={() => {
                    generateWeeklyPDF(
                      weeklyLog,
                      dailyNotes,
                      userTimezone,
                      weekRange,
                      user
                    );
                  }}
                >
                  Download Weekly Report
                </button>
                <button
  className="px-2 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold rounded-lg shadow-white shadow-md animate-pulse transition duration-300 cursor-pointer"
  onClick={async () => {
    const pdfBytes = await generateMonthlyPDF(monthlyLogsByWeek, user);
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    saveAs(blob, `MonthlyReport_${new Date().toLocaleString('default', { month: 'long', year: 'numeric' }).replace(/ /g, '_')}.pdf`);
  }}
>
  Download Monthly Report
</button>
              </div>
            </div>
          </div>
          <div className="translate-y-5 sm:translate-y-5 md:translate-y-5 lg:translate-y-5 flex justify-center items-center gap-5">
            <a
              href="https://www.linkedin.com/in/filipefrances/"
              target="_blank"
            >
              <FaLinkedin className="text-3xl text-blue-500 hover:text-blue-600 transition" />
            </a>
            <a href="https://github.com/fpfrances" target="_blank">
              <FaGithub className="text-3xl text-gray-400 hover:text-white transition" />
            </a>
          </div>
        </RevealOnScroll>
      </section>
    </>
  );
};
