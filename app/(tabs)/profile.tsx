import React, { useState } from 'react';
import { Switch } from 'react-native';
import { 
  Dialog, 
  Portal, 
  Button as PaperButton, 
  Text as PaperText, 
  Card, 
  Avatar, 
  Surface, 
  Divider,
  Modal as PaperModal,
  Switch as PaperSwitch,
  RadioButton,
  List
} from 'react-native-paper';
import { useTheme } from '@/contexts/ThemeContext';
import * as NavigationBar from 'expo-navigation-bar';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, CreditCard as Edit3, MapPin, Clock, Zap, Trophy, Users, Calendar, Target, Moon, Sun, Smartphone } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
// import { Button } from '@/components/Button'; // Replaced with Paper Button
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { locationUtils } from '@/utils/locationUtils';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { theme, themeMode, setThemeMode } = useTheme();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [themeSettingsVisible, setThemeSettingsVisible] = useState(false);

  const handleLogout = () => {
    setLogoutDialogVisible(true);
  };

  const confirmLogout = async () => {
    setLogoutDialogVisible(false);
    await logout();
    router.replace('/(auth)/welcome');
  };

  const cancelLogout = () => {
    setLogoutDialogVisible(false);
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
          <PaperText variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>Your Stats</PaperText>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <Card key={index} style={[styles.statCard, { flex: 1, minWidth: '47%', margin: 4 }]}>
                <Card.Content style={{ alignItems: 'center', padding: 16 }}>
                  <stat.icon size={20} color={stat.color} />
                  <PaperText variant="titleMedium" style={[styles.statValue, { color: theme.colors.text, marginTop: 8 }]}>{stat.value}</PaperText>
                  <PaperText variant="bodySmall" style={[styles.statLabel, { color: theme.colors.text, marginTop: 2, textAlign: 'center' }]}>{stat.label}</PaperText>
                </Card.Content>
              </Card>
            ))}
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <PaperText variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Activities</PaperText>
            <TouchableOpacity>
              <PaperText variant="bodyMedium" style={[styles.seeAll, { color: theme.colors.primary[500] }]}>See All</PaperText>
            </TouchableOpacity>
          </View>
          <View style={styles.activitiesContainer}>
            <Card style={{ marginBottom: 8 }}>
              <Card.Content style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                <Surface style={[styles.activityIcon, { backgroundColor: theme.colors.background }]}> 
                  <MapPin size={16} color={theme.colors.primary[500]} />
                </Surface>
                <View style={styles.activityInfo}>
                  <PaperText variant="titleSmall" style={{ color: theme.colors.text }}>Morning Run</PaperText>
                  <PaperText variant="bodySmall" style={{ color: theme.colors.text, marginTop: 2 }}>
                    5.2km • 28:34 • Yesterday
                  </PaperText>
                </View>
                <PaperText variant="titleSmall" style={{ color: theme.colors.primary[500] }}>5:29/km</PaperText>
              </Card.Content>
            </Card>
            <Card style={{ marginBottom: 8 }}>
              <Card.Content style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                <Surface style={[styles.activityIcon, { backgroundColor: theme.colors.background }]}> 
                  <Zap size={16} color={theme.colors.secondary[500]} />
                </Surface>
                <View style={styles.activityInfo}>
                  <PaperText variant="titleSmall" style={{ color: theme.colors.text }}>Evening Cycle</PaperText>
                  <PaperText variant="bodySmall" style={{ color: theme.colors.text, marginTop: 2 }}>
                    15.8km • 45:12 • 2 days ago
                  </PaperText>
                </View>
                <PaperText variant="titleSmall" style={{ color: theme.colors.secondary[500] }}>21.2 km/h</PaperText>
              </Card.Content>
            </Card>
            <Card style={{ marginBottom: 8 }}>
              <Card.Content style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                <Surface style={[styles.activityIcon, { backgroundColor: theme.colors.background }]}> 
                  <Calendar size={16} color={theme.colors.accent[500]} />
                </Surface>
                <View style={styles.activityInfo}>
                  <PaperText variant="titleSmall" style={{ color: theme.colors.text }}>Weekend Hike</PaperText>
                  <PaperText variant="bodySmall" style={{ color: theme.colors.text, marginTop: 2 }}>
                    8.1km • 2:15:30 • 3 days ago
                  </PaperText>
                </View>
                <PaperText variant="titleSmall" style={{ color: theme.colors.accent[500] }}>16:41/km</PaperText>
              </Card.Content>
            </Card>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <PaperText variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>Achievements</PaperText>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement, index) => (
              <Card 
                key={index} 
                style={[
                  styles.achievementCard,
                  { flex: 1, minWidth: '47%', margin: 4 },
                  !achievement.earned && { opacity: 0.5 }
                ]}
              >
                <Card.Content style={{ alignItems: 'center', padding: 16 }}>
                  <PaperText style={styles.achievementIcon}>{achievement.icon}</PaperText>
                  <PaperText variant="titleSmall" style={[
                    styles.achievementTitle,
                    { color: theme.colors.text, textAlign: 'center', marginBottom: 4 }
                  ]}>
                    {achievement.title}
                  </PaperText>
                  <PaperText variant="bodySmall" style={[
                    styles.achievementDescription,
                    { color: theme.colors.text, textAlign: 'center' }
                  ]}>
                    {achievement.description}
                  </PaperText>
                </Card.Content>
              </Card>
            ))}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <PaperText variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>Settings</PaperText>
          <Card style={styles.settingsCard} elevation={2}>
            <Card.Content>
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <PaperText variant="bodyLarge" style={{ color: theme.colors.text }}>Theme</PaperText>
                  <PaperText variant="bodySmall" style={{ color: theme.colors.secondary[500] }}>
                    {themeMode === 'auto' ? 'Follow system' : themeMode === 'dark' ? 'Dark mode' : 'Light mode'}
                  </PaperText>
                </View>
                <PaperButton
                  mode="outlined"
                  onPress={() => setThemeSettingsVisible(true)}
                  compact
                >
                  Change
                </PaperButton>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <PaperButton
            mode="outlined"
            onPress={() => {}}
            style={styles.actionButton}
          >
            Edit Profile
          </PaperButton>
          <PaperButton
            mode="outlined"
            onPress={handleLogout}
            style={styles.actionButton}
            textColor={theme.colors.error[500]}
          >
            Sign Out
          </PaperButton>
        </View>
      </ScrollView>
      <Portal>
        <PaperModal
          visible={settingsVisible}
          onDismiss={() => setSettingsVisible(false)}
          contentContainerStyle={{
            backgroundColor: theme.colors.modal,
            padding: 32,
            borderRadius: 24,
            alignItems: 'center',
            width: 320,
            alignSelf: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 16,
            elevation: 8
          }}
        >
          <PaperText variant="headlineSmall" style={{ color: theme.colors.text, marginBottom: 16 }}>
            Settings
          </PaperText>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <PaperText style={{ marginRight: 8, color: theme.colors.text }}>Light</PaperText>
            <PaperSwitch
              value={theme.mode === 'dark'}
              onValueChange={(value) => setThemeMode(value ? 'dark' : 'light')}
            />
            <PaperText style={{ marginLeft: 8, color: theme.colors.text }}>Dark</PaperText>
          </View>
          <PaperButton onPress={() => setSettingsVisible(false)} style={{ marginTop: 8, width: 120 }}>
            Close
          </PaperButton>
        </PaperModal>
      </Portal>
      
      <Portal>
        <Dialog visible={logoutDialogVisible} onDismiss={cancelLogout}>
          <Dialog.Title>Sign Out</Dialog.Title>
          <Dialog.Content>
            <PaperText variant="bodyMedium" style={{ color: theme.colors.text }}>
              Are you sure you want to sign out?
            </PaperText>
          </Dialog.Content>
          <Dialog.Actions>
            <PaperButton onPress={cancelLogout}>Cancel</PaperButton>
            <PaperButton 
              onPress={confirmLogout}
              textColor={theme.colors.error[500]}
            >
              Sign Out
            </PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      <Portal>
        <Dialog visible={themeSettingsVisible} onDismiss={() => setThemeSettingsVisible(false)}>
          <Dialog.Title>Choose Theme</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group onValueChange={(value) => setThemeMode(value as 'light' | 'dark' | 'auto')} value={themeMode}>
              <View style={styles.themeOption}>
                <View style={styles.themeOptionContent}>
                  <Smartphone size={20} color={theme.colors.text} />
                  <View style={styles.themeOptionText}>
                    <PaperText variant="bodyLarge" style={{ color: theme.colors.text }}>Follow System</PaperText>
                    <PaperText variant="bodySmall" style={{ color: theme.colors.secondary[500] }}>Use your device's theme setting</PaperText>
                  </View>
                </View>
                <RadioButton value="auto" />
              </View>
              <View style={styles.themeOption}>
                <View style={styles.themeOptionContent}>
                  <Sun size={20} color={theme.colors.text} />
                  <View style={styles.themeOptionText}>
                    <PaperText variant="bodyLarge" style={{ color: theme.colors.text }}>Light Mode</PaperText>
                    <PaperText variant="bodySmall" style={{ color: theme.colors.secondary[500] }}>Always use light theme</PaperText>
                  </View>
                </View>
                <RadioButton value="light" />
              </View>
              <View style={styles.themeOption}>
                <View style={styles.themeOptionContent}>
                  <Moon size={20} color={theme.colors.text} />
                  <View style={styles.themeOptionText}>
                    <PaperText variant="bodyLarge" style={{ color: theme.colors.text }}>Dark Mode</PaperText>
                    <PaperText variant="bodySmall" style={{ color: theme.colors.secondary[500] }}>Always use dark theme</PaperText>
                  </View>
                </View>
                <RadioButton value="dark" />
              </View>
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <PaperButton onPress={() => setThemeSettingsVisible(false)}>Done</PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  settingsCard: {
    marginBottom: Spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  settingInfo: {
    flex: 1,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  themeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  themeOptionText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
});