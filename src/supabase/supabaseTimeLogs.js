import { supabase } from "../supabaseClient";

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
    const durationHours = (clockOut - clockIn) / (1000 * 60 * 60); // duration in hours

    return {
      id: log.id,
      clockInTime: log.clock_in,
      clockOutTime: log.clock_out,
      duration: durationHours,
      note: log.note || "",
    };
  });
}