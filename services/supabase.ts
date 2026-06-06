import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY in your .env file.'
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
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
    logger.debug('Testing Supabase connection...', 'Supabase');
    
    // Simple query to test connection - this will work even without tables
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      // If table doesn't exist, that's actually good - it means connection works
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        logger.info('Supabase connected successfully! (Tables not created yet)', 'Supabase');
        return { success: true, message: 'Connected - tables need to be created' };
      }
      throw error;
    }
    
    logger.info('Supabase connected successfully!', 'Supabase');
    return { success: true, message: 'Connected and tables exist' };
    
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return { success: false, error: (error as Error).message };
  }
};
