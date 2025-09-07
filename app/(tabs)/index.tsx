import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Clock, Zap, Trophy, Target, TrendingUp, Play } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Text as PaperText,
  Card,
  Surface,
  ProgressBar,
  IconButton
} from 'react-native-paper';

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
            <PaperText variant="bodyLarge" style={{ color: theme.colors.secondary[500] }}>Good morning,</PaperText>
            <PaperText variant="headlineMedium" style={{ color: theme.colors.text }}>{user?.username || 'Athlete'}</PaperText>
          </View>
          <Surface style={[styles.streakContainer, { backgroundColor: theme.mode === 'dark' ? theme.colors.accent[900] : theme.colors.accent[50] }]} elevation={1}> 
            <PaperText variant="titleLarge" style={{ color: theme.colors.accent[500] }}>7</PaperText>
            <PaperText variant="bodySmall" style={{ color: theme.mode === 'dark' ? theme.colors.accent[400] : theme.colors.accent[600] }}>day streak</PaperText>
          </Surface>
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
              <PaperText variant="titleLarge" style={{ color: theme.colors.text }}>Ready to move?</PaperText>
              <PaperText variant="bodyMedium" style={{ color: theme.colors.text, opacity: 0.9 }}>Start your workout</PaperText>
            </View>
            <View style={styles.playButton}>
              <Play size={24} color="white" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Stats */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <PaperText variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>Your Stats</PaperText>
          </View>
          <View style={styles.statsGrid}>
            {quickStats.map((stat, index) => (
              <Card key={index} style={[styles.statCard, { backgroundColor: theme.colors.card }]} elevation={2}> 
                <Card.Content style={styles.statCardContent}>
                  <View style={[styles.statIconContainer, { backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                    <stat.icon size={20} color={stat.color} />
                  </View>
                  <PaperText variant="headlineMedium" style={[styles.statValue, { color: theme.colors.text }]}>{stat.value}</PaperText>
                  <PaperText variant="bodyMedium" style={[styles.statLabel, { color: theme.colors.secondary[500] }]}>{stat.label}</PaperText>
                </Card.Content>
              </Card>
            ))}
          </View>
        </View>

        {/* Weekly Goals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <PaperText variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>Weekly Goals</PaperText>
            <IconButton icon={() => <Target size={20} color={theme.colors.primary[500]} />} size={20} onPress={() => {}} />
          </View>
          <View style={styles.goalsContainer}>
            {weeklyGoals.map((goal, index) => (
              <Card key={index} style={[styles.goalCard, { backgroundColor: theme.colors.card }]} elevation={2}> 
                <Card.Content>
                  <View style={styles.goalHeader}>
                    <PaperText variant="bodyMedium" style={[styles.goalTitle, { color: theme.colors.text }]}>{goal.title}</PaperText>
                    <PaperText variant="bodyMedium" style={[styles.goalProgress, { color: theme.colors.primary[500] }]}>
                      {goal.current}/{goal.target} {goal.unit}
                    </PaperText>
                  </View>
                  <ProgressBar 
                    progress={Math.min(goal.current / goal.target, 1)} 
                    color={theme.colors.primary[500]}
                    style={[styles.progressBar, { backgroundColor: theme.mode === 'dark' ? theme.colors.neutral[700] : theme.colors.neutral[200] }]}
                  />
                </Card.Content>
              </Card>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <PaperText variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Activity</PaperText>
            <IconButton 
              icon={() => <TrendingUp size={20} color={theme.colors.primary[500]} />} 
              size={20} 
              onPress={() => router.push('/(tabs)/feed')} 
            />
          </View>
          <View style={styles.recentActivity}>
            <Card style={[styles.activityCard, { backgroundColor: theme.colors.card }]} elevation={2}> 
              <Card.Content style={styles.activityItem}>
                <Surface style={[styles.activityIcon, { backgroundColor: theme.mode === 'dark' ? theme.colors.primary[900] : theme.colors.primary[50] }]} elevation={1}> 
                  <MapPin size={16} color={theme.colors.primary[500]} />
                </Surface>
                <View style={styles.activityInfo}>
                  <PaperText variant="bodyMedium" style={[styles.activityTitle, { color: theme.colors.text }]}>Morning Run</PaperText>
                  <PaperText variant="bodySmall" style={[styles.activityDetails, { color: theme.colors.secondary[500] }]}>5.2km • 28:34 • Yesterday</PaperText>
                </View>
                <PaperText variant="bodyMedium" style={[styles.activityPace, { color: theme.colors.primary[500] }]}>5:29/km</PaperText>
              </Card.Content>
            </Card>
            <Card style={[styles.activityCard, { backgroundColor: theme.colors.card }]} elevation={2}> 
              <Card.Content style={styles.activityItem}>
                <Surface style={[styles.activityIcon, { backgroundColor: theme.mode === 'dark' ? theme.colors.secondary[900] : theme.colors.secondary[50] }]} elevation={1}> 
                  <Zap size={16} color={theme.colors.secondary[500]} />
                </Surface>
                <View style={styles.activityInfo}>
                  <PaperText variant="bodyMedium" style={[styles.activityTitle, { color: theme.colors.text }]}>Evening Cycle</PaperText>
                  <PaperText variant="bodySmall" style={[styles.activityDetails, { color: theme.colors.secondary[500] }]}>15.8km • 45:12 • 2 days ago</PaperText>
                </View>
                <PaperText variant="bodyMedium" style={[styles.activityPace, { color: theme.colors.primary[500] }]}>21.2 km/h</PaperText>
              </Card.Content>
            </Card>
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
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  statCard: {
    width: '47%',
    borderRadius: BorderRadius.lg,
    minHeight: 120,
  },
  statCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    minHeight: 88,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
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
  activityCard: {
    marginBottom: Spacing.sm,
  },
});