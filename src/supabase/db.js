import { supabase } from '../supabaseClient';

// Auth
export const signUpUser = async (email, password, name) => {
  // Sign up user with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }, // user metadata
  });

  if (error) return { data, error };
    return { data, error: null };
};

export const loginUser = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const logoutUser = async () => {
  return await supabase.auth.signOut();
};

// Time logs Table
export const getTimeLogs = async (userId) => {
  const { data, error } = await supabase
    .from('time_logs')
    .select('*')
    .eq('user_id', userId);
  return { data, error };
};

export const addTimeLog = async (timeLog) => {
  const { data, error } = await supabase
    .from('time_logs')
    .insert(timeLog);
  return { data, error };
};