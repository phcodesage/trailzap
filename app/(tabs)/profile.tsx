import React, { useState } from 'react';
import { Modal, Switch } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import * as NavigationBar from 'expo-navigation-bar';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, CreditCard as Edit3, MapPin, Clock, Zap, Trophy, Users, Calendar } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { locationUtils } from '@/utils/locationUtils';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [settingsVisible, setSettingsVisible] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/welcome');
  };

  const stats = [
    { 
      icon: MapPin, 
      label: 'Total Distance', 
      value: locationUtils.formatDistance((user?.totalDistance || 0) * 1000),
      color: theme.colors.primary[500]
    },
    { 
      icon: Clock, 
      label: 'Total Time', 
      value: locationUtils.formatDuration(user?.totalDuration || 0),
      color: theme.colors.secondary[500]
    },
    { 
      icon: Zap, 
      label: 'Activities', 
      value: user?.totalActivities?.toString() || '0',
      color: theme.colors.accent[500]
    },
    { 
      icon: Trophy, 
      label: 'PRs This Year', 
      value: '8',
      color: theme.colors.warning[500]
    },
  ];

  const achievements = [
    { title: '100km Club', description: 'Completed 100km in a month', icon: '🏃‍♂️', earned: true },
    { title: 'Early Bird', description: '10 morning workouts', icon: '🌅', earned: true },
    { title: 'Mountain Goat', description: '500m elevation in one activity', icon: '🏔️', earned: false },
    { title: 'Consistency King', description: '30 day streak', icon: '🔥', earned: false },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.card }]}> 
          <View style={styles.profileInfo}>
            <Image 
              source={{ 
                uri: user?.profilePic || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1' 
              }} 
              style={styles.avatar} 
            />
            <View style={styles.userDetails}>
              <Text style={[styles.username, { color: theme.colors.text }]}>{user?.username || 'Athlete'}</Text>
              <Text style={[styles.email, { color: theme.colors.text }]}>{user?.email || ''}</Text>
              <View style={styles.followStats}>
                <Text style={[styles.followText, { color: theme.colors.text }]}>
                  <Text style={[styles.followNumber, { color: theme.colors.text }]}>{user?.followers?.length || 0}</Text> followers
                </Text>
                <Text style={[styles.followText, { color: theme.colors.text }]}>
                  <Text style={[styles.followNumber, { color: theme.colors.text }]}>{user?.following?.length || 0}</Text> following
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.settingsButton} onPress={() => setSettingsVisible(true)}>
            <Settings size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Your Stats</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={[styles.statCard, { backgroundColor: theme.colors.card }]}> 
                <stat.icon size={20} color={stat.color} />
                <Text style={[styles.statValue, { color: theme.colors.text }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.text }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Activities</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { color: theme.colors.primary[500] }]}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.activitiesContainer}>
            <View style={[styles.activityItem, { backgroundColor: theme.colors.card }]}> 
              <View style={[styles.activityIcon, { backgroundColor: theme.colors.background }]}> 
                <MapPin size={16} color={theme.colors.primary[500]} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={[styles.activityTitle, { color: theme.colors.text }]}>Morning Run</Text>
                <Text style={[styles.activityDetails, { color: theme.colors.text }]}>
                  5.2km • 28:34 • Yesterday
                </Text>
              </View>
              <Text style={[styles.activityPace, { color: theme.colors.primary[500] }]}>5:29/km</Text>
            </View>
            <View style={[styles.activityItem, { backgroundColor: theme.colors.card }]}> 
              <View style={[styles.activityIcon, { backgroundColor: theme.colors.background }]}> 
                <Zap size={16} color={theme.colors.secondary[500]} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={[styles.activityTitle, { color: theme.colors.text }]}>Evening Cycle</Text>
                <Text style={[styles.activityDetails, { color: theme.colors.text }]}>
                  15.8km • 45:12 • 2 days ago
                </Text>
              </View>
              <Text style={[styles.activityPace, { color: theme.colors.secondary[500] }]}>21.2 km/h</Text>
            </View>
            <View style={[styles.activityItem, { backgroundColor: theme.colors.card }]}> 
              <View style={[styles.activityIcon, { backgroundColor: theme.colors.background }]}> 
                <Calendar size={16} color={theme.colors.accent[500]} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={[styles.activityTitle, { color: theme.colors.text }]}>Weekend Hike</Text>
                <Text style={[styles.activityDetails, { color: theme.colors.text }]}>
                  8.1km • 2:15:30 • 3 days ago
                </Text>
              </View>
              <Text style={[styles.activityPace, { color: theme.colors.accent[500] }]}>16:41/km</Text>
            </View>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Achievements</Text>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement, index) => (
              <View 
                key={index} 
                style={[
                  styles.achievementCard,
                  { backgroundColor: theme.colors.card },
                  !achievement.earned && styles.achievementCardLocked
                ]}
              >
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <Text style={[
                  styles.achievementTitle,
                  { color: theme.colors.text },
                  !achievement.earned && styles.achievementTitleLocked
                ]}>
                  {achievement.title}
                </Text>
                <Text style={[
                  styles.achievementDescription,
                  { color: theme.colors.text },
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
            style={styles.actionButton}
            textStyle={{ color: theme.colors.error[500] }}
          />
        </View>
      </ScrollView>
      <Modal
        visible={settingsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.modalBackdrop }}>
          <View style={{ backgroundColor: theme.colors.modal, padding: 32, borderRadius: 24, alignItems: 'center', width: 320, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.text, marginBottom: 16 }}>Theme</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ marginRight: 8, color: theme.colors.text }}>Light</Text>
              <Switch
                value={theme.mode === 'dark'}
                onValueChange={toggleTheme}
                thumbColor={theme.mode === 'dark' ? theme.colors.primary[500] : theme.colors.neutral[400]}
                trackColor={{ false: theme.colors.neutral[300], true: theme.colors.primary[300] }}
              />
              <Text style={{ marginLeft: 8, color: theme.colors.text }}>Dark</Text>
            </View>
            <Button title="Close" onPress={() => setSettingsVisible(false)} style={{ marginTop: 8, width: 120 }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
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
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: Spacing.sm,
  },
  followStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  followText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  followNumber: {
    fontFamily: 'Inter-SemiBold',
  },
  settingsButton: {
    padding: Spacing.sm,
  },
  section: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
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
    marginBottom: Spacing.md,
  },
  seeAll: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
    textAlign: 'center',
  },
  activitiesContainer: {
    gap: Spacing.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  activityIcon: {
    width: 32,
    height: 32,
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
  },
  activityDetails: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  activityPace: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  achievementCard: {
    flex: 1,
    minWidth: '47%',
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
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementTitleLocked: {},
  achievementDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  achievementDescriptionLocked: {},
  actionButton: {
    marginBottom: Spacing.md,
  },
  logoutButton: {},
  logoutButtonText: {},
});