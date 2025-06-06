import { useEffect, useState } from "react";
import { RevealOnScroll } from "../RevealOnScroll";
import { supabase } from "../../supabaseClient";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { getWeeklyLogs } from "../../supabase/supabaseTimeLogs";


// Basic Modal Component
const NoteModal = ({ open, note, setNote, onSave, onCancel }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white p-6 rounded-lg w-[90%] max-w-md">
        <h2 className="text-lg text-black font-semibold mb-2">What did you work on today?</h2>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 50))}
          className="w-full text-black p-2 border border-gray-300 rounded mb-4"
          rows={3}
          maxLength={50}
          placeholder="Max 50 characters..."
        />
        <div className="flex justify-end space-x-2">
          <button onClick={onCancel} className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400">Cancel</button>
          <button onClick={onSave} className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">Save</button>
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
  const [weeklyLog, setWeeklyLog] = useState({ Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 });
  const [dailyNotes, setDailyNotes] = useState({ Mon: "", Tue: "", Wed: "", Thu: "", Fri: "", Sat: "", Sun: "" });
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [currentDayKey, setCurrentDayKey] = useState("");
  const [activeLogId, setActiveLogId] = useState(null);
  const [isLockingClockIn, setIsLockingClockIn] = useState(false);

  const weekdayMap = {
    Mon: "Monday",
    Tue: "Tuesday",
    Wed: "Wednesday",
    Thu: "Thursday",
    Fri: "Friday",
    Sat: "Saturday",
    Sun: "Sunday",
  };

  const getDayKey = (date) => {
  const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, ...
  const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return dayMap[dayIndex];
};

  const handleClockIn = async () => {
  if (isClockedIn || isLockingClockIn) return;

  setIsLockingClockIn(true);
  const now = new Date();

  // Format local time as "YYYY-MM-DDTHH:mm:ss"
  const getLocalISOString = (date = new Date()) => {
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  const localTime = getLocalISOString(now);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  const { data, error } = await supabase.from("time_logs").insert([
    {
      user_id: user.id,
      clock_in: localTime,    // local time string
      timezone,               // e.g., "America/New_York"
    }
  ]).select().single();

  if (error) {
    console.error("Error during clock-in:", error);
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

  // Reuse the local time formatter from handleClockIn
  const getLocalISOString = (date = new Date()) => {
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  const localTime = getLocalISOString(now);
  const durationMs = now - new Date(clockInTime);
  const durationHrs = durationMs / (1000 * 60 * 60);
  const dayKey = getDayKey(now);

  setWeeklyLog((prev) => ({
    ...prev,
    [dayKey]: parseFloat((prev[dayKey] + durationHrs).toFixed(2)),
  }));

  const { error } = await supabase
    .from("time_logs")
    .update({ clock_out: localTime })
    .eq("id", activeLogId);

  if (error) {
    console.error("Error updating clock-out:", error);
    return;
  }

  setCurrentDayKey(dayKey);
  setNoteDraft("");
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
      console.error("No active log ID found for update.");
      return;
    }

    const { error } = await supabase
      .from("time_logs")
      .update({
        note: noteDraft,
      })
      .eq("id", activeLogId);

    if (error) {
      console.error("Failed to update time log:", error);
    } else {
      // Update dailyNotes state with new note for immediate UI update
      setDailyNotes((prev) => ({
        ...prev,
        [currentDayKey]: noteDraft,
      }));

      // Reset clock times & active log AFTER saving note
      setClockInTime(null);
      setIsClockedIn(false);
      setActiveLogId(null);
    }
  } catch (err) {
    console.error("Unexpected error updating time log:", err);
  }

  setNoteModalOpen(false);
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
    const getUserAndLogs = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (!authData?.user) {
        console.error("User not found", authError);
        return;
      }

      const user = authData.user;
      setUser(user);

      //const timezoneOffset = new Date().getTimezoneOffset() * 60000;

      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
      const now = new Date();
      const localNow = new Date(now.toLocaleString("en-US", { timeZone: userTimeZone }));
      const day = localNow.getDay() || 7;
      const startOfWeekLocal = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() - day + 1);

      // Convert to UTC ISO string
      const weekStartUTC = startOfWeekLocal.toISOString();

      //const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      //const monthStartUTC = startOfMonth.toISOString();

      try {
        const weekly = await getWeeklyLogs(user.id, weekStartUTC);
        //const monthly = await getWeeklyLogs(user.id, monthStartUTC); // Replace if separate monthly fetching is needed

        const tempWeeklyLog = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
        const tempDailyNotes = { Mon: "", Tue: "", Wed: "", Thu: "", Fri: "", Sat: "", Sun: "" };

        weekly.forEach((log) => {
        const logTime = log.clockOutTime || log.clockInTime;

        const localDateStr = new Date(logTime).toLocaleString("en-US", {
          timeZone: userTimeZone,
        });
        const localDate = new Date(localDateStr); // parse the local time safely
        const dayKey = localDate.toLocaleDateString("en-US", { weekday: "short" });

        tempWeeklyLog[dayKey] += parseFloat(log.duration || 0);
        tempDailyNotes[dayKey] = log.note || "";
      });

        setWeeklyLog(tempWeeklyLog);
        setDailyNotes(tempDailyNotes);
      } catch (error) {
        console.error("Failed to load logs:", error);
      }
    };

    const getWeekNumber = (date) => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    };

    const resetWeeklyData = () => {
      setWeeklyLog({ Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 });
      setDailyNotes({ Mon: "", Tue: "", Wed: "", Thu: "", Fri: "", Sat: "", Sun: "" });
      setClockInTime(null);
      setClockOutTime(null);
      setIsClockedIn(false);
    };

    const checkWeeklyReset = () => {
      const now = new Date();
      const isSunday = now.getDay() === 0;
      const isLateSunday = isSunday && now.getHours() === 23 && now.getMinutes() >= 59;
      const lastReset = localStorage.getItem("lastWeeklyReset");
      const lastResetDate = lastReset ? new Date(lastReset) : null;
      const shouldReset = isLateSunday && (!lastResetDate || getWeekNumber(now) !== getWeekNumber(lastResetDate));

      if (shouldReset) {
        resetWeeklyData();
        localStorage.setItem("lastWeeklyReset", now.toISOString());
      }
    };

    getUserAndLogs();
    checkWeeklyReset();

    interval = setInterval(checkWeeklyReset, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      await supabase.auth.signOut();
      window.location.replace("/");
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
    <section id="home" className="flex flex-col items-center justify-start min-h-screen p-20">
      <RevealOnScroll>
        <div className="z-10 px-2 mb-5">
        <h1 className="masked-text text-5xl font-bold mb-20">Welcome to your Dashboard</h1>
        <div className="flex justify-between items-center">
          {user && (
            <p className="text-lg text-white">
              Hello, {user.user_metadata.name || user.email}!
            </p>
          )}
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold rounded-lg shadow-white shadow-md animate-pulse transition duration-300"
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
                {Object.entries(dailyNotes).map(([key, note]) =>
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
              <h2 className="text-xl font-semibold text-white text-center">Weekly hours</h2>
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
                        position: "top",
                        fill: "#fff",
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
            <h3 className="text-xl font-semibold mb-4 text-white">Clock In / Out</h3>
            <div className="flex flex-col space-y-4">
              <button
                onClick={handleClockIn}
                disabled={isClockedIn || isLockingClockIn}
                className={`py-2 rounded font-semibold transition ${
                  isClockedIn
                    ? "bg-gray-400 cursor-not-allowed text-white"
                    : "bg-white text-purple-600 hover:bg-purple-100"
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
                    ? "bg-gray-400 cursor-not-allowed text-white"
                    : "bg-white text-purple-600 hover:bg-purple-100"
                }`}
              >
                Clock Out
              </button>
              {clockOutTime && <p className="text-white">Clocked out at: {new Date(clockOutTime).toLocaleTimeString()}</p>}
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
        <div className="w-full mt-6 bg-gradient-to-r from-purple-500 to-blue-600 transition-all duration-500 px-6 py-10 rounded-lg shadow-md mb-6">
            <div className="flex flex-col md:flex-row items-center justify-between w-full">
                <div className="max-w-[300px] sm:max-w-[400px] md:max-w-[300px] lg:max-w-[350px] text-white break-words">
                    <h2 className="text-xl font-semibold text-white text-center justify-center mb-2">
                        Download your weekly/monthly report
                    </h2>
                </div>
                <div className="md:w-1/2 w-full flex flex-col items-center justify-left mt-2">
                  <button
                    onClick={handleLogout}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold rounded-lg shadow-white shadow-md animate-pulse transition duration-300"
                    >
                    Download PDF
                  </button>
                </div>
            </div>
        </div>
      </RevealOnScroll>
    </section>
    </>
  );
};