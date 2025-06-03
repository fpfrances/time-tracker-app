import { supabase } from "../supabaseClient"; // adjust path as needed

export const compileMonthlyLogs = async (userId, timezone) => {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const startOfMonthUTC = new Date(startOfMonth.getTime() - timezoneOffset).toISOString();
  const endOfMonthUTC = new Date(endOfMonth.getTime() - timezoneOffset).toISOString();

  const { data: monthLogs, error: monthLogsError } = await supabase
    .from("time_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("clock_in", startOfMonthUTC)
    .lte("clock_in", endOfMonthUTC);

  if (monthLogsError) throw monthLogsError;

  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  };

  const groupedLogs = {};

  monthLogs.forEach((log) => {
    const localClockIn = new Date(
      new Date(log.clock_in).toLocaleString("en-US", { timeZone: timezone })
    );
    const weekNum = getWeekNumber(localClockIn);
    const dayKey = localClockIn.toLocaleDateString("en-US", { weekday: "short" });

    const clockOut = log.clock_out ? new Date(log.clock_out) : new Date(log.clock_in);
    const duration = (new Date(clockOut) - new Date(log.clock_in)) / (1000 * 60 * 60);

    if (!groupedLogs[weekNum]) {
      groupedLogs[weekNum] = {
        weekNumber: weekNum,
        range: "",
        logs: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
        notes: { Mon: "", Tue: "", Wed: "", Thu: "", Fri: "", Sat: "", Sun: "" },
        timestamps: { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] },
      };
    }

    groupedLogs[weekNum].logs[dayKey] += duration;
    if (log.note) groupedLogs[weekNum].notes[dayKey] = log.note;
    groupedLogs[weekNum].timestamps[dayKey].push({
      in: new Date(log.clock_in).toLocaleString("en-US", { timeZone: timezone }),
      out: log.clock_out
        ? new Date(log.clock_out).toLocaleString("en-US", { timeZone: timezone })
        : null,
    });
  });

  // Convert to array with range info
  const sortedWeeklyLogs = Object.values(groupedLogs).map((weekGroup) => {
    const jan1 = new Date(now.getFullYear(), 0, 1);
    const weekStart = new Date(jan1.setDate(jan1.getDate() + (weekGroup.weekNumber - 1) * 7));
    const weekStartLocal = new Date(weekStart.toLocaleString("en-US", { timeZone: timezone }));
    const weekEndLocal = new Date(weekStartLocal);
    weekEndLocal.setDate(weekEndLocal.getDate() + 6);

    weekGroup.range = `${weekStartLocal.toLocaleDateString()} - ${weekEndLocal.toLocaleDateString()}`;
    return weekGroup;
  });

  return sortedWeeklyLogs;
};