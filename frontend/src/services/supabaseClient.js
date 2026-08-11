import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Profile Functions
export async function getProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('ft_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || { monthly_income: 0 };
  } catch (err) {
    console.error('Error fetching profile:', err);
    return { monthly_income: 0 };
  }
}

export async function updateMonthlyIncome(userId, monthlyIncome) {
  try {
    const { data, error } = await supabase
      .from('ft_profiles')
      .upsert({ id: userId, monthly_income: parseFloat(monthlyIncome) })
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error updating monthly income:', err);
    throw err;
  }
}

// Transaction Functions
export async function getTransactions(userId) {
  try {
    const { data, error } = await supabase
      .from('ft_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching transactions:', err);
    return [];
  }
}

export async function addTransaction(transactionData) {
  try {
    const { data, error } = await supabase
      .from('ft_transactions')
      .insert([transactionData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error adding transaction:', err);
    throw err;
  }
}

export const deleteTransaction = async (id) => {
  const { data, error } = await supabase
    .from('ft_transactions') // O 'transactions'
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting from Supabase:', error);
    throw error;
  }

  return data;
};

export const getUserProfile = getProfile;
export const getUserTransactions = getTransactions;
export const updateUserIncome = updateMonthlyIncome;