import { supabase } from "../supabaseClient";

// Fetch logs starting from a given date (weekly or from any day forward)
export async function getWeeklyLogs(user_id, fromDateISO) {
  const { data, error } = await supabase
    .from("time_logs")
    .select("id, clock_in, clock_out, note")
    .eq("user_id", user_id)
    .gte("clock_in", fromDateISO)
    .order("clock_in", { ascending: true });

  if (error) {
    console.error("Error fetching weekly logs:", error);
    return [];
  }

  return data.map((log) => {
    const clockIn = new Date(log.clock_in);
    const clockOut = log.clock_out ? new Date(log.clock_out) : new Date();
    const durationHours = (clockOut - clockIn) / (1000 * 60 * 60);

    return {
      id: log.id,
      clockInTime: clockIn,
      clockOutTime: log.clock_out ? clockOut : null,
      duration: durationHours,
      note: log.note || "",
    };
  });
}

// Fetch logs within a specific month (year and month required)
export async function getMonthlyLogs(user_id, year, month) {
  const fromDate = new Date(year, month - 1, 1);
  const toDate = new Date(year, month, 1);

  const fromDateISO = fromDate.toISOString();
  const toDateISO = toDate.toISOString();

  console.log("Fetching logs between:", fromDateISO, "and", toDateISO);

  const { data, error } = await supabase
    .from("time_logs")
    .select("id, clock_in, clock_out, note")
    .eq("user_id", user_id)
    .gte("clock_in", fromDateISO)
    .lt("clock_in", toDateISO)
    .order("clock_in", { ascending: true });

  if (error) {
    console.error("Error fetching monthly logs:", error);
    return [];
  }

  console.log("Monthly logs fetched:", data);

  return data.map((log) => {
    const clockIn = new Date(log.clock_in);
    const clockOut = log.clock_out ? new Date(log.clock_out) : new Date();
    const durationHours = (clockOut - clockIn) / (1000 * 60 * 60);

    return {
      id: log.id,
      clockInTime: clockIn,
      clockOutTime: log.clock_out ? clockOut : null,
      duration: durationHours,
      note: log.note || "",
    };
  });
}
