import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, CreditCard as Edit3, MapPin, Clock, Zap, Trophy, Users, Calendar } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { locationUtils } from '@/utils/locationUtils';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/welcome');
  };

  const stats = [
    { 
      icon: MapPin, 
      label: 'Total Distance', 
      value: locationUtils.formatDistance((user?.totalDistance || 0) * 1000),
      color: Colors.primary[500] 
    },
    { 
      icon: Clock, 
      label: 'Total Time', 
      value: locationUtils.formatDuration(user?.totalDuration || 0),
      color: Colors.secondary[500] 
    },
    { 
      icon: Zap, 
      label: 'Activities', 
      value: user?.totalActivities?.toString() || '0',
      color: Colors.accent[500] 
    },
    { 
      icon: Trophy, 
      label: 'PRs This Year', 
      value: '8',
      color: Colors.warning[500] 
    },
  ];

  const achievements = [
    { title: '100km Club', description: 'Completed 100km in a month', icon: '🏃‍♂️', earned: true },
    { title: 'Early Bird', description: '10 morning workouts', icon: '🌅', earned: true },
    { title: 'Mountain Goat', description: '500m elevation in one activity', icon: '🏔️', earned: false },
    { title: 'Consistency King', description: '30 day streak', icon: '🔥', earned: false },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileInfo}>
            <Image 
              source={{ 
                uri: user?.profilePic || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1' 
              }} 
              style={styles.avatar} 
            />
            <View style={styles.userDetails}>
              <Text style={styles.username}>{user?.username || 'Athlete'}</Text>
              <Text style={styles.email}>{user?.email || ''}</Text>
              <View style={styles.followStats}>
                <Text style={styles.followText}>
                  <Text style={styles.followNumber}>{user?.followers?.length || 0}</Text> followers
                </Text>
                <Text style={styles.followText}>
                  <Text style={styles.followNumber}>{user?.following?.length || 0}</Text> following
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={24} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <stat.icon size={20} color={stat.color} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activities</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.activitiesContainer}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <MapPin size={16} color={Colors.primary[500]} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Morning Run</Text>
                <Text style={styles.activityDetails}>5.2km • 28:34 • Yesterday</Text>
              </View>
              <Text style={styles.activityPace}>5:29/km</Text>
            </View>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Zap size={16} color={Colors.secondary[500]} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Evening Cycle</Text>
                <Text style={styles.activityDetails}>15.8km • 45:12 • 2 days ago</Text>
              </View>
              <Text style={styles.activityPace}>21.2 km/h</Text>
            </View>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Calendar size={16} color={Colors.accent[500]} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Weekend Hike</Text>
                <Text style={styles.activityDetails}>8.1km • 2:15:30 • 3 days ago</Text>
              </View>
              <Text style={styles.activityPace}>16:41/km</Text>
            </View>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement, index) => (
              <View 
                key={index} 
                style={[
                  styles.achievementCard,
                  !achievement.earned && styles.achievementCardLocked
                ]}
              >
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <Text style={[
                  styles.achievementTitle,
                  !achievement.earned && styles.achievementTitleLocked
                ]}>
                  {achievement.title}
                </Text>
                <Text style={[
                  styles.achievementDescription,
                  !achievement.earned && styles.achievementDescriptionLocked
                ]}>
                  {achievement.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Button
            title="Edit Profile"
            onPress={() => {}}
            variant="outline"
            style={styles.actionButton}
          />
          <Button
            title="Sign Out"
            onPress={handleLogout}
            variant="outline"
            style={[styles.actionButton, styles.logoutButton]}
            textStyle={styles.logoutButtonText}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: Spacing.md,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  followStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  followText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
  },
  followNumber: {
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
  },
  settingsButton: {
    padding: Spacing.sm,
  },
  
  // Sections
  section: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  seeAll: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.primary[500],
  },
  
  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.background.secondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: Colors.text.primary,
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  
  // Activities
  activitiesContainer: {
    gap: Spacing.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  activityIcon: {
    width: 32,
    height: 32,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
  },
  activityDetails: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
    marginTop: 2,
  },
  activityPace: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.primary[500],
  },
  
  // Achievements
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  achievementCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.background.secondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  achievementCardLocked: {
    opacity: 0.5,
  },
  achievementIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  achievementTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementTitleLocked: {
    color: Colors.text.secondary,
  },
  achievementDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  achievementDescriptionLocked: {
    color: Colors.text.tertiary,
  },
  
  // Actions
  actionButton: {
    marginBottom: Spacing.md,
  },
  logoutButton: {
    borderColor: Colors.error[500],
  },
  logoutButtonText: {
    color: Colors.error[500],
  },
});