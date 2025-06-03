import { supabase } from "../supabaseClient";

// Fetch weekly logs for a specific user starting from a given date (UTC ISO string)
export async function getWeeklyLogs(user_id, fromDateISO) {
  const { data, error } = await supabase
    .from("time_logs")
    .select("*")
    .eq("user_id", user_id)
    .gte("clock_in", fromDateISO)
    .order("clock_in", { ascending: true });

  if (error) {
    console.error("Error fetching weekly logs:", error);
    return [];
  }
  return data;
}