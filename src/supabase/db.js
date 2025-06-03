import { supabase } from '../supabaseClient';

// Auth
export const signUpUser = async (email, password, name) => {
  // 1. Sign up user with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }, // optional user metadata
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

// Profile Management (separate function for creating/updating profiles)

export const createUserProfile = async (userId, name, email) => {
  const { data, error } = await supabase
    .from("users")
    .upsert({ id: userId, name, email }, { onConflict: "id" }) // if 'email' is part of your table
    .select()
    .single();

  return { data, error };
};

export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  return { data, error };
};

export const updateUserProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId)
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