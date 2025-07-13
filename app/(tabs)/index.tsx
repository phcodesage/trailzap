import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Clock, Zap, Trophy, Target, TrendingUp, Play } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { useTheme } from '@/contexts/ThemeContext';

export default function HomeScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();

  const quickStats = [
    { icon: MapPin, label: 'Distance', value: '456.7km', color: theme.colors.primary[500] },
    { icon: Clock, label: 'Time', value: '42h 15m', color: theme.colors.secondary[500] },
    { icon: Zap, label: 'Activities', value: '42', color: theme.colors.accent[500] },
    { icon: Trophy, label: 'PRs', value: '8', color: theme.colors.warning[500] },
  ];

  const weeklyGoals = [
    { title: 'Weekly Distance', current: 25.3, target: 50, unit: 'km' },
    { title: 'Active Days', current: 4, target: 5, unit: 'days' },
    { title: 'Calories', current: 2150, target: 3000, unit: 'cal' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["bottom", "left", "right", "top"]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.colors.secondary[500] }]}>Good morning,</Text>
            <Text style={[styles.username, { color: theme.colors.text }]}>{user?.username || 'Athlete'}</Text>
          </View>
          <TouchableOpacity style={[styles.streakContainer, { backgroundColor: theme.colors.accent[50] }]}> 
            <Text style={[styles.streakNumber, { color: theme.colors.accent[500] }]}>7</Text>
            <Text style={[styles.streakText, { color: theme.colors.accent[600] }]}>day streak</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Action */}
        <TouchableOpacity 
          style={styles.quickActionContainer}
          onPress={() => router.push('/(tabs)/track')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.colors.primary[500], theme.colors.primary[600]]}
            style={styles.quickAction}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.quickActionContent}>
              <Text style={[styles.quickActionTitle, { color: theme.colors.text }]}>Ready to move?</Text>
              <Text style={[styles.quickActionSubtitle, { color: theme.colors.text, opacity: 0.9 }]}>Start your workout</Text>
            </View>
            <View style={styles.playButton}>
              <Play size={24} color={theme.colors.inverse} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Your Stats</Text>
          <View style={styles.statsGrid}>
            {quickStats.map((stat, index) => (
              <View key={index} style={[styles.statCard, { backgroundColor: theme.colors.card }]}> 
                <stat.icon size={20} color={stat.color} />
                <Text style={[styles.statValue, { color: theme.colors.text }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.secondary[500] }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Weekly Goals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Weekly Goals</Text>
            <TouchableOpacity>
              <Target size={20} color={theme.colors.primary[500]} />
            </TouchableOpacity>
          </View>
          <View style={styles.goalsContainer}>
            {weeklyGoals.map((goal, index) => (
              <View key={index} style={[styles.goalCard, { backgroundColor: theme.colors.card }]}> 
                <View style={styles.goalHeader}>
                  <Text style={[styles.goalTitle, { color: theme.colors.text }]}>{goal.title}</Text>
                  <Text style={[styles.goalProgress, { color: theme.colors.primary[500] }]}>
                    {goal.current}/{goal.target} {goal.unit}
                  </Text>
                </View>
                <View style={[styles.progressBar, { backgroundColor: theme.colors.neutral[200] }]}> 
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${Math.min((goal.current / goal.target) * 100, 100)}%`, backgroundColor: theme.colors.primary[500] }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/feed')}>
              <TrendingUp size={20} color={theme.colors.primary[500]} />
            </TouchableOpacity>
          </View>
          <View style={styles.recentActivity}>
            <View style={[styles.activityItem, { backgroundColor: theme.colors.card }]}> 
              <View style={[styles.activityIcon, { backgroundColor: theme.colors.background }]}> 
                <MapPin size={16} color={theme.colors.primary[500]} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={[styles.activityTitle, { color: theme.colors.text }]}>Morning Run</Text>
                <Text style={[styles.activityDetails, { color: theme.colors.secondary[500] }]}>5.2km • 28:34 • Yesterday</Text>
              </View>
              <Text style={[styles.activityPace, { color: theme.colors.primary[500] }]}>5:29/km</Text>
            </View>
            <View style={[styles.activityItem, { backgroundColor: theme.colors.card }]}> 
              <View style={[styles.activityIcon, { backgroundColor: theme.colors.background }]}> 
                <Zap size={16} color={theme.colors.secondary[500]} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={[styles.activityTitle, { color: theme.colors.text }]}>Evening Cycle</Text>
                <Text style={[styles.activityDetails, { color: theme.colors.secondary[500] }]}>15.8km • 45:12 • 2 days ago</Text>
              </View>
              <Text style={[styles.activityPace, { color: theme.colors.primary[500] }]}>21.2 km/h</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  greeting: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  username: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginTop: 2,
  },
  streakContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  streakNumber: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  streakText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  quickActionContainer: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    opacity: 0.9,
  },
  playButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
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
  },
  goalsContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  goalCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  goalTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  goalProgress: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  progressBar: {
    height: 6,
    borderRadius: BorderRadius.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.xs,
  },
  recentActivity: {
    paddingHorizontal: Spacing.lg,
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
});