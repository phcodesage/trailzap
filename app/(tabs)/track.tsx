import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Pause, Square, MapPin, Clock, Zap } from 'lucide-react-native';
import * as Location from 'expo-location';
import { Button } from '@/components/Button';
import { locationUtils } from '@/utils/locationUtils';
import { GeoPoint } from '@/types/activity';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { activityAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Text as PaperText,
  Card,
  Surface,
  Button as PaperButton,
  Dialog,
  Portal
} from 'react-native-paper';

type TrackingState = 'idle' | 'tracking' | 'paused';



export default function TrackScreen() {
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
const [startTime, setStartTime] = useState<Date | null>(null);
const [currentDistance, setCurrentDistance] = useState(0);
const [currentPace, setCurrentPace] = useState(0);
  const { user } = useAuth();
  const { theme } = useTheme();

  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [trackingState, setTrackingState] = useState<TrackingState>('idle');
  const [currentRoute, setCurrentRoute] = useState<GeoPoint[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTracking = async () => {
    if (!hasLocationPermission) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(status === 'granted');
      return;
    }

    try {
      // Get initial position
      const initialLocation = await locationUtils.getCurrentLocation();
      if (!initialLocation) {
        Alert.alert('Error', 'Unable to get your current location');
        return;
      }

      // Start location tracking
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          const geoPoint: GeoPoint = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude || undefined,
            timestamp: Date.now(),
          };
          
          setCurrentRoute(prev => {
            const newRoute = [...prev, geoPoint];
            
            // Calculate distance
            if (newRoute.length > 1) {
              const totalDistance = locationUtils.calculateTotalDistance(newRoute);
              // Skip setting distance since state variable is not defined
              // TODO: Add currentDistance state variable and setter
              
              // Calculate pace (minutes per km)
              const timeInMinutes = elapsedTime / 60;
              const distanceInKm = totalDistance / 1000;
              if (distanceInKm > 0) {
                // Skip setting pace since state variable is not defined
                // TODO: Add currentPace state variable and setter
              }
            }
            
            return newRoute;
          });
        }
      );

      setLocationSubscription(subscription);
      setTrackingState('tracking');
      setStartTime(new Date());
      setCurrentRoute([initialLocation]);
      setElapsedTime(0);
      setCurrentDistance(0);
      setCurrentPace(0);
    } catch (error) {
      console.error('Failed to start tracking:', error);
      Alert.alert('Error', 'Failed to start tracking your activity');
    }
  };

  const pauseTracking = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    setTrackingState('paused');
  };

  const resumeTracking = async () => {
    if (!hasLocationPermission) return;

    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          const geoPoint: GeoPoint = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude || undefined,
            timestamp: Date.now(),
          };
          
          setCurrentRoute(prev => [...prev, geoPoint]);
        }
      );

      setLocationSubscription(subscription);
      setTrackingState('tracking');
    } catch (error) {
      console.error('Failed to resume tracking:', error);
    }
  };

  const stopTracking = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }

    if (currentDistance < 100) { // Less than 100 meters
      Alert.alert(
        'Activity Too Short',
        'Your activity is too short to save. Would you like to discard it?',
        [
          { text: 'Continue Tracking', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: resetTracking },
        ]
      );
      return;
    }

    Alert.alert(
      'Save Activity',
      `Great workout! You covered ${locationUtils.formatDistance(currentDistance)} in ${locationUtils.formatDuration(elapsedTime)}.`,
      [
        {
          text: 'Save Activity',
          onPress: saveActivity,
        },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: resetTracking,
        },
      ]
    );
  };

  const saveActivity = async () => {
    if (!startTime || !user) {
      resetTracking();
      return;
    }

    try {
      const endTime = new Date();
      const elevationGain = locationUtils.calculateElevationGain(currentRoute);
      
      const activityData = {
        title: `${user.username}'s Activity`,
        description: `Tracked activity covering ${locationUtils.formatDistance(currentDistance)}`,
        type: 'running', // Default to running, could be made selectable
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: elapsedTime,
        distance: currentDistance,
        elevationGain,
        avgPace: currentPace * 60, // Convert to seconds per km
        routePoints: currentRoute,
        isPublic: true,
      };

      await activityAPI.createActivity(activityData);
      
      Alert.alert(
        'Activity Saved!',
        'Your activity has been saved successfully.',
        [{ text: 'OK', onPress: resetTracking }]
      );
    } catch (error: any) {
      console.error('Failed to save activity:', error);
      Alert.alert('Error', 'Failed to save your activity. Please try again.');
    }
  };

  const resetTracking = () => {
    setTrackingState('idle');
    setCurrentRoute([]);
    setStartTime(null);
    setElapsedTime(0);
    setCurrentDistance(0);
    setCurrentPace(0);
  };

  if (!hasLocationPermission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
        <View style={styles.permissionContainer}>
          <Surface style={styles.permissionIconContainer} elevation={2}>
            <MapPin size={48} color={theme.colors.primary[500]} />
          </Surface>
          <PaperText variant="headlineMedium" style={[styles.permissionTitle, { color: theme.colors.text }]}>Location Access Required</PaperText>
          <PaperText variant="bodyLarge" style={[styles.permissionText, { color: theme.colors.secondary[500] }]}>TrailZap needs access to your location to track your fitness activities and create route maps.</PaperText>
          <PaperButton
            mode="contained"
            onPress={startTracking}
            style={styles.permissionButton}
          >
            Grant Permission
          </PaperButton>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <PaperText variant="headlineLarge" style={[styles.title, { color: theme.colors.text }]}>Track Activity</PaperText>
          <PaperText variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.secondary[500] }]}>Ready to start your workout?</PaperText>
        </View>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.mainStatCard} elevation={3}>
            <Card.Content style={styles.mainStat}>
              <PaperText variant="displayMedium" style={[styles.mainStatValue, { color: theme.colors.primary[500] }]}>
                {locationUtils.formatDistance(currentDistance)}
              </PaperText>
              <PaperText variant="titleMedium" style={[styles.mainStatLabel, { color: theme.colors.secondary[500] }]}>Distance</PaperText>
            </Card.Content>
          </Card>
          <View style={styles.statsRow}>
            <Card style={styles.statCard} elevation={2}>
              <Card.Content style={styles.statItem}>
                <Surface style={[styles.statIconContainer, { backgroundColor: theme.colors.accent[50] }]} elevation={1}>
                  <Clock size={20} color={theme.colors.accent[500]} />
                </Surface>
                <PaperText variant="titleLarge" style={[styles.statValue, { color: theme.colors.text }]}>
                  {locationUtils.formatDuration(elapsedTime)}
                </PaperText>
                <PaperText variant="bodySmall" style={[styles.statLabel, { color: theme.colors.secondary[500] }]}>Time</PaperText>
              </Card.Content>
            </Card>
            <Card style={styles.statCard} elevation={2}>
              <Card.Content style={styles.statItem}>
                <Surface style={[styles.statIconContainer, { backgroundColor: theme.colors.accent[50] }]} elevation={1}>
                  <Zap size={20} color={theme.colors.accent[500]} />
                </Surface>
                <PaperText variant="titleLarge" style={[styles.statValue, { color: theme.colors.text }]}>
                  {currentPace > 0 ? `${currentPace.toFixed(1)}` : '--'}
                </PaperText>
                <PaperText variant="bodySmall" style={[styles.statLabel, { color: theme.colors.secondary[500] }]}>Pace (min/km)</PaperText>
              </Card.Content>
            </Card>
          </View>
        </View>
        {/* Map Placeholder */}
        <View style={styles.mapContainer}>
          <Card style={styles.mapCard} elevation={2}>
            <Card.Content style={styles.mapPlaceholder}>
              <Surface style={styles.mapIconContainer} elevation={1}>
                <MapPin size={32} color={theme.colors.primary[500]} />
              </Surface>
              <PaperText variant="bodyLarge" style={[styles.mapText, { color: theme.colors.secondary[500] }]}> 
                {trackingState === 'idle' 
                  ? 'Your route will appear here'
                  : `Tracking your route • ${currentRoute.length} points recorded`
                }
              </PaperText>
            </Card.Content>
          </Card>
        </View>
        {/* Controls */}
        <View style={styles.controls}>
          {trackingState === 'idle' && (
            <PaperButton
              mode="contained"
              onPress={startTracking}
              style={styles.startButton}
              contentStyle={styles.buttonContent}
            >
              Start Activity
            </PaperButton>
          )}
          {trackingState === 'tracking' && (
            <View style={styles.trackingControls}>
              <PaperButton
                mode="contained-tonal"
                onPress={pauseTracking}
                style={styles.controlButton}
                icon={() => <Pause size={20} color={theme.colors.primary[500]} />}
              >
                Pause
              </PaperButton>
              <PaperButton
                mode="outlined"
                onPress={stopTracking}
                style={styles.controlButton}
                icon={() => <Square size={20} color={theme.colors.error[500]} />}
              >
                Stop
              </PaperButton>
            </View>
          )}
          {trackingState === 'paused' && (
            <View style={styles.trackingControls}>
              <PaperButton
                mode="contained"
                onPress={resumeTracking}
                style={styles.controlButton}
                icon={() => <Play size={20} color="white" />}
              >
                Resume
              </PaperButton>
              <PaperButton
                mode="outlined"
                onPress={stopTracking}
                style={styles.controlButton}
                icon={() => <Square size={20} color={theme.colors.error[500]} />}
              >
                Stop
              </PaperButton>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  permissionTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  permissionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  permissionButton: {
    minWidth: 200,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  statsContainer: {
    marginBottom: Spacing.xl,
  },
  mainStat: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  mainStatValue: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
  },
  mainStatLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginTop: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  mapContainer: {
    flex: 1,
    marginBottom: Spacing.xl,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  mapText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  controls: {
    paddingBottom: Spacing.lg,
  },
  startButton: {},
  trackingControls: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  controlButton: {
    flex: 1,
  },
  permissionIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  mainStatCard: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  statCard: {
    flex: 1,
    marginHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  mapCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
  },
  mapIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  buttonContent: {
    paddingVertical: Spacing.sm,
  },
});
