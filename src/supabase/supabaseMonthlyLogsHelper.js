/*


// UNCOMMENT THIS SNIPPET AND PLACE IN TO PRINT LAST WEEK REPORT BUTTON
import { supabase } from "../supabaseClient";

export const getLastMonthLogs = async (userId, userTimezone) => {
  const now = new Date();

  // First day of current month
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // First day of last month
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Last day of last month
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  endOfLastMonth.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("time_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("clock_in", startOfLastMonth.toISOString())
    .lte("clock_out", endOfLastMonth.toISOString());

  if (error) {
    console.error("Error fetching last month logs:", error);
    return {};
  }

  const monthlyLogsByWeek = {};

  data.forEach((log) => {
    if (!log.clock_in || !log.clock_out) return;

    // Convert to user's timezone
    const clockInLocal = new Date(
      new Date(log.clock_in).toLocaleString("en-US", { timeZone: userTimezone })
    );
    const clockOutLocal = new Date(
      new Date(log.clock_out).toLocaleString("en-US", { timeZone: userTimezone })
    );

    const duration = (clockOutLocal - clockInLocal) / (1000 * 60 * 60);

    // Get week start (Monday)
    const day = clockInLocal.getDay() || 7;
    const weekStart = new Date(clockInLocal);
    weekStart.setDate(clockInLocal.getDate() - day + 1);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekRange = `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;

    if (!monthlyLogsByWeek[weekRange]) {
      monthlyLogsByWeek[weekRange] = [];
    }

    monthlyLogsByWeek[weekRange].push({
      clockInTime: clockInLocal,
      clockOutTime: clockOutLocal,
      duration,
      note: log.note || "",
    });
  });

  return monthlyLogsByWeek;
};

// ADD THIS IMPORT TO DASHBOARD.JSX
import { getLastMonthLogs } from "../../supabase/supabaseMonthlyLogsHelper";

// SUBSTITUTE THIS SNIPPET INTO DASHBOARD.JSX WHERE INDICATED TO PRINT LAST WEEK REPORT BUTTON
<button
  className="px-2 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold rounded-lg shadow-white shadow-md animate-pulse transition duration-300 cursor-pointer"
  onClick={async () => {
    if (!user) return;

    const monthlyLogsByWeek = await getLastMonthLogs(user.id, userTimezone);

    if (!Object.keys(monthlyLogsByWeek).length) {
      alert("No logs found for last month");
      return;
    }

    generateMonthlyPDF(monthlyLogsByWeek, user);
  }}
>
  Download Monthly Report
</button>


*/