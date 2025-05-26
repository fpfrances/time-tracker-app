import { supabase } from '../supabaseClient';

// Auth
export const signUpUser = async (email, password, metadata = {}) => {
  console.log("Calling supabase.auth.signUp with:", { email, password, metadata });

  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
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

// Profiles Table (example)
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const updateUserProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .single();
  return { data, error };
};

// Example: Time logs Table
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