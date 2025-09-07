import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MapPin, Clock, Zap, Heart, MessageCircle } from 'lucide-react-native';
import { Activity } from '@/types/activity';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { locationUtils } from '@/utils/locationUtils';
import { useTheme } from '@/contexts/ThemeContext';
import { Text as PaperText, Card, Surface } from 'react-native-paper';

interface ActivityCardProps {
  activity: Activity;
  onPress?: () => void;
  onLike?: () => void;
  onComment?: () => void;
}

export function ActivityCard({ activity, onPress, onLike, onComment }: ActivityCardProps) {
  const { theme } = useTheme();
  
  return (
    <Card style={styles.container} elevation={2}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Card.Content>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image 
              source={{ uri: activity.user.profilePic || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=1' }} 
              style={styles.avatar} 
            />
            <View>
              <PaperText variant="titleMedium" style={[styles.username, { color: theme.colors.text }]}>{activity.user.username}</PaperText>
              <PaperText variant="bodyMedium" style={[styles.activityType, { color: theme.colors.secondary[500] }]}>{activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}</PaperText>
            </View>
          </View>
          <PaperText variant="bodySmall" style={[styles.timestamp, { color: theme.colors.neutral[500] }]}>
            {new Date(activity.createdAt).toLocaleDateString()}
          </PaperText>
        </View>

        <PaperText variant="titleLarge" style={[styles.title, { color: theme.colors.text }]}>{activity.title}</PaperText>
        
        {activity.description && (
          <PaperText variant="bodyMedium" style={[styles.description, { color: theme.colors.secondary[500] }]}>{activity.description}</PaperText>
        )}

        <View style={styles.mapContainer}>
          <Surface style={[styles.mapPlaceholder, { backgroundColor: theme.colors.card }]} elevation={1}>
            <MapPin size={24} color={theme.colors.primary[500]} />
            <PaperText variant="bodyMedium" style={[styles.mapText, { color: theme.colors.secondary[500] }]}>Route Map</PaperText>
          </Surface>
        </View>

        <View style={[styles.stats, { borderTopColor: theme.colors.border.light }]}>
          <View style={styles.statItem}>
            <MapPin size={16} color={theme.colors.secondary[500]} />
            <PaperText variant="bodyMedium" style={[styles.statValue, { color: theme.colors.text }]}>{locationUtils.formatDistance(activity.distance)}</PaperText>
          </View>
          <View style={styles.statItem}>
            <Clock size={16} color={theme.colors.secondary[500]} />
            <PaperText variant="bodyMedium" style={[styles.statValue, { color: theme.colors.text }]}>{locationUtils.formatDuration(activity.duration)}</PaperText>
          </View>
          <View style={styles.statItem}>
            <Zap size={16} color={theme.colors.secondary[500]} />
            <PaperText variant="bodyMedium" style={[styles.statValue, { color: theme.colors.text }]}>{locationUtils.formatPace(activity.avgPace)}</PaperText>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={onLike}>
            <Heart 
              size={20} 
              color={activity.likes.includes('current-user-id') ? theme.colors.error[500] : theme.colors.secondary[500]}
              fill={activity.likes.includes('current-user-id') ? theme.colors.error[500] : 'transparent'}
            />
            <PaperText variant="bodyMedium" style={[styles.actionText, { color: theme.colors.secondary[500] }]}>{activity.likes.length}</PaperText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onComment}>
            <MessageCircle size={20} color={theme.colors.secondary[500]} />
            <PaperText variant="bodyMedium" style={[styles.actionText, { color: theme.colors.secondary[500] }]}>{activity.comments.length}</PaperText>
          </TouchableOpacity>
        </View>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.sm,
  },
  username: {
    fontFamily: 'Inter-SemiBold',
  },
  activityType: {
    fontFamily: 'Inter-Regular',
  },
  timestamp: {
    fontFamily: 'Inter-Regular',
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    marginBottom: Spacing.xs,
  },
  description: {
    fontFamily: 'Inter-Regular',
    marginBottom: Spacing.sm,
  },
  mapContainer: {
    height: 120,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  mapText: {
    fontFamily: 'Inter-Medium',
    marginTop: Spacing.xs,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    marginBottom: Spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Inter-Medium',
    marginLeft: Spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontFamily: 'Inter-Medium',
    marginLeft: Spacing.xs,
  },
});