import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MapPin, Clock, Zap, Heart, MessageCircle } from 'lucide-react-native';
import { Activity } from '@/types/activity';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { locationUtils } from '@/utils/locationUtils';

interface ActivityCardProps {
  activity: Activity;
  onPress?: () => void;
  onLike?: () => void;
  onComment?: () => void;
}

export function ActivityCard({ activity, onPress, onLike, onComment }: ActivityCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image 
            source={{ uri: activity.user.profilePic || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=1' }} 
            style={styles.avatar} 
          />
          <View>
            <Text style={styles.username}>{activity.user.username}</Text>
            <Text style={styles.activityType}>{activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}</Text>
          </View>
        </View>
        <Text style={styles.timestamp}>
          {new Date(activity.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <Text style={styles.title}>{activity.title}</Text>
      
      {activity.description && (
        <Text style={styles.description}>{activity.description}</Text>
      )}

      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <MapPin size={24} color={Colors.primary[500]} />
          <Text style={styles.mapText}>Route Map</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <MapPin size={16} color={Colors.text.secondary} />
          <Text style={styles.statValue}>{locationUtils.formatDistance(activity.distance)}</Text>
        </View>
        <View style={styles.statItem}>
          <Clock size={16} color={Colors.text.secondary} />
          <Text style={styles.statValue}>{locationUtils.formatDuration(activity.duration)}</Text>
        </View>
        <View style={styles.statItem}>
          <Zap size={16} color={Colors.text.secondary} />
          <Text style={styles.statValue}>{locationUtils.formatPace(activity.avgPace)}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={onLike}>
          <Heart 
            size={20} 
            color={activity.likes.includes('current-user-id') ? Colors.error[500] : Colors.text.secondary}
            fill={activity.likes.includes('current-user-id') ? Colors.error[500] : 'transparent'}
          />
          <Text style={styles.actionText}>{activity.likes.length}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onComment}>
          <MessageCircle size={20} color={Colors.text.secondary} />
          <Text style={styles.actionText}>{activity.comments.length}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: Colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
  },
  activityType: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.text.tertiary,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
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
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    marginBottom: Spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.text.primary,
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
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
  },
});