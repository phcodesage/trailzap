import { supabase } from '@/services/supabase';
import { Activity, GeoPoint } from '@/types/activity';
import { logger } from '@/utils/logger';

const PAGE_SIZE = 20;

// Maps a Supabase GeoJSON `route` column back to the app's GeoPoint[] shape.
function mapRoute(route: any): GeoPoint[] {
  if (!route?.coordinates) return [];
  const timestamps: number[] = route.properties?.timestamps ?? [];
  return route.coordinates.map((coord: number[], i: number) => ({
    longitude: coord[0],
    latitude: coord[1],
    altitude: coord[2] ?? 0,
    timestamp: timestamps[i] ?? 0,
  }));
}

// Maps a Supabase `activities` row (with embedded user + likes) to the Activity type.
function mapActivity(row: any): Activity {
  return {
    id: row.id,
    userId: row.user_id,
    user: {
      username: row.users?.username ?? 'user',
      profilePic: row.users?.profile_pic ?? undefined,
    },
    title: row.title,
    description: row.description ?? undefined,
    startTime: row.start_time,
    endTime: row.end_time,
    duration: row.duration ?? 0,
    distance: row.distance ?? 0,
    elevationGain: row.elevation_gain ?? 0,
    avgPace: row.avg_pace ?? 0,
    maxSpeed: row.max_speed ?? 0,
    calories: row.calories ?? 0,
    route: mapRoute(row.route),
    type: row.type,
    isPublic: row.is_public,
    likes: (row.activity_likes ?? []).map((like: any) => like.user_id),
    comments: [],
    createdAt: row.created_at,
  };
}

export const feedService = {
  // Public activity feed, newest first, paginated.
  async getFeed({
    page = 1,
    limit = PAGE_SIZE,
  }: { page?: number; limit?: number } = {}) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('activities')
      .select(
        '*, users:user_id (username, profile_pic), activity_likes (user_id)',
        { count: 'exact' },
      )
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      logger.error('Failed to load feed', 'feedService', error);
      throw error;
    }

    const activities = (data ?? []).map(mapActivity);
    const hasNextPage =
      count != null ? to + 1 < count : activities.length === limit;

    return { activities, pagination: { hasNextPage } };
  },

  // Toggles the current user's like on an activity. Returns the new state.
  async likeActivity(activityId: string): Promise<{ isLiked: boolean }> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be signed in to like activities.');

    const { data: existing, error: selectError } = await supabase
      .from('activity_likes')
      .select('id')
      .eq('activity_id', activityId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (selectError) {
      logger.error('Failed to check like state', 'feedService', selectError);
      throw selectError;
    }

    if (existing) {
      const { error } = await supabase
        .from('activity_likes')
        .delete()
        .eq('id', existing.id);
      if (error) throw error;
      return { isLiked: false };
    }

    const { error } = await supabase
      .from('activity_likes')
      .insert([{ activity_id: activityId, user_id: user.id }]);
    if (error) throw error;
    return { isLiked: true };
  },
};
