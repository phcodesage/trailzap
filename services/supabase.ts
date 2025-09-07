import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rkmvynxikljottftfjzn.supabase.co',
  process.env.EXPO_PUBLIC_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbXZ5bnhpa2xqb3R0ZnRmanpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMzU4MzcsImV4cCI6MjA3MjgxMTgzN30.ZRb-HexYjQTqHVtlh4KneB92GCzXnUCSFu25DdeT0mg',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  }
);

// Test Supabase connection
export const testSupabaseConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Simple query to test connection - this will work even without tables
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      // If table doesn't exist, that's actually good - it means connection works
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('✅ Supabase connected successfully! (Tables not created yet)');
        return { success: true, message: 'Connected - tables need to be created' };
      }
      throw error;
    }
    
    console.log('✅ Supabase connected successfully!');
    return { success: true, message: 'Connected and tables exist' };
    
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return { success: false, error: (error as Error).message };
  }
};
