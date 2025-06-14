import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Clock, Zap, Trophy, Target, TrendingUp } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';

export default function HomeScreen() {
  const { user } = useAuth();

  const quickStats = [
    { icon: MapPin, label: 'Distance', value: '456.7km', color: Colors.primary[500] },
    { icon: Clock, label: 'Time', value: '42h 15m', color: Colors.secondary[500] },
    { icon: Zap, label: 'Activities', value: '42', color: Colors.accent[500] },
    { icon: Trophy, label: 'PRs', value: '8', color: Colors.warning[500] },
  ];

  const weeklyGoals = [
    { title: 'Weekly Distance', current: 25.3, target: 50, unit: 'km' },
    { title: 'Active Days', current: 4, target: 5, unit: 'days' },
    { title: 'Calories', current: 2150, target: 3000, unit: 'cal' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.username}>{user?.username || 'Athlete'}</Text>
          </View>
          <TouchableOpacity style={styles.streakContainer}>
            <Text style={styles.streakNumber}>7</Text>
            <Text style={styles.streakText}>day streak</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Action */}
        <TouchableOpacity 
          style={styles.quickActionContainer}
          onPress={() => router.push('/(tabs)/track')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Colors.primary[500], Colors.primary[600]]}
            style={styles.quickAction}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>Ready to move?</Text>
              <Text style={styles.quickActionSubtitle}>Start your workout</Text>
            </View>
            <View style={styles.playButton}>
              <Play size={24} color={Colors.text.inverse} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            {quickStats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <stat.icon size={20} color={stat.color} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Weekly Goals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Weekly Goals</Text>
            <TouchableOpacity>
              <Target size={20} color={Colors.primary[500]} />
            </TouchableOpacity>
          </View>
          <View style={styles.goalsContainer}>
            {weeklyGoals.map((goal, index) => (
              <View key={index} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Text style={styles.goalProgress}>
                    {goal.current}/{goal.target} {goal.unit}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }
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
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/feed')}>
              <TrendingUp size={20} color={Colors.primary[500]} />
            </TouchableOpacity>
          </View>
          <View style={styles.recentActivity}>
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
          </View>
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
    color: Colors.text.secondary,
  },
  username: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: Colors.text.primary,
    marginTop: 2,
  },
  streakContainer: {
    alignItems: 'center',
    backgroundColor: Colors.accent[50],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  streakNumber: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: Colors.accent[500],
  },
  streakText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.accent[600],
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
    color: Colors.text.inverse,
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.text.inverse,
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
    color: Colors.text.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
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
  },
  goalsContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  goalCard: {
    backgroundColor: Colors.background.secondary,
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
    color: Colors.text.primary,
  },
  goalProgress: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.primary[500],
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.neutral[200],
    borderRadius: BorderRadius.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.xs,
  },
  recentActivity: {
    paddingHorizontal: Spacing.lg,
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
});