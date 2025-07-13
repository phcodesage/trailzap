import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityCard } from '@/components/ActivityCard';
import { Activity } from '@/types/activity';
import { Spacing } from '@/constants/Spacing';
import { socialAPI, activityAPI } from '@/services/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useTheme } from '@/contexts/ThemeContext';

export default function FeedScreen() {
  const { theme } = useTheme();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      const response = await socialAPI.getFeed({ page: pageNum, limit: 20 });
      
      if (pageNum === 1 || refresh) {
        setActivities(response.activities);
      } else {
        setActivities(prev => [...prev, ...response.activities]);
      }
      
      setHasNextPage(response.pagination?.hasNextPage || false);
      setPage(pageNum);
    } catch (error: any) {
      console.error('Failed to load feed:', error);
      Alert.alert('Error', 'Failed to load activity feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadFeed(1, true);
  };

  const handleLoadMore = () => {
    if (hasNextPage && !refreshing && !loading) {
      loadFeed(page + 1);
    }
  };

  const handleLike = async (activityId: string) => {
    try {
      const response = await socialAPI.likeActivity(activityId);
      
      setActivities(prevActivities =>
        prevActivities.map(activity => {
          if (activity.id === activityId) {
            return {
              ...activity,
              likes: response.isLiked 
                ? [...activity.likes, 'current-user-id']
                : activity.likes.filter(id => id !== 'current-user-id'),
            };
          }
          return activity;
        })
      );
    } catch (error: any) {
      console.error('Failed to like activity:', error);
      Alert.alert('Error', 'Failed to update like status');
    }
  };

  const handleComment = (activityId: string) => {
    // TODO: Navigate to activity detail screen with comment section
    console.log('Comment on activity:', activityId);
  };

  const handleActivityPress = (activityId: string) => {
    // TODO: Navigate to activity detail screen
    console.log('View activity details:', activityId);
  };

  const renderActivity = ({ item }: { item: Activity }) => (
    <ActivityCard
      activity={item}
      onPress={() => handleActivityPress(item.id)}
      onLike={() => handleLike(item.id)}
      onComment={() => handleComment(item.id)}
    />
  );

  if (loading && activities.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={[styles.header, { borderBottomColor: theme.colors.border.light }]}> 
        <Text style={[styles.title, { color: theme.colors.text }]}>Activity Feed</Text>
        <Text style={[styles.subtitle, { color: theme.colors.secondary[500] }]}>See what your friends are up to</Text>
      </View>
      <FlatList
        data={activities}
        renderItem={renderActivity}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary[500]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No activities yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.secondary[500] }]}>Follow some athletes to see their activities here</Text>
          </View>
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  listContent: {
    padding: Spacing.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});