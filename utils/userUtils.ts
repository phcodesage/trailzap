import { User } from '@/types/auth';

/**
 * Converts a Supabase user object to the application's User type
 */
export function transformSupabaseUser(supabaseUser: any): User {
  return {
    id: supabaseUser.id,
    username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || 'user',
    email: supabaseUser.email || '',
    bio: supabaseUser.user_metadata?.bio || null,
    location: supabaseUser.user_metadata?.location || null,
    isPrivate: supabaseUser.user_metadata?.isPrivate || false,
    createdAt: supabaseUser.created_at,
    updatedAt: supabaseUser.updated_at || supabaseUser.created_at,
    followers: [],
    following: [],
    totalActivities: 0,
    totalDistance: 0,
    totalDuration: 0,
    joinDate: supabaseUser.created_at,
  };
}