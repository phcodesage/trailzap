import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Pause, Square, MapPin, Clock, Zap } from 'lucide-react-native';
import * as Location from 'expo-location';
import { Button } from '@/components/Button';
import { locationUtils } from '@/utils/locationUtils';
import { GeoPoint } from '@/types/activity';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { supabase } from '@/services/supabase';
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
import { SegmentedButtons } from 'react-native-paper';

type TrackingState = 'idle' | 'tracking' | 'paused';
type ActivityType = 'walk' | 'jog' | 'bicycle';


export default function TrackScreen() {
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentDistance, setCurrentDistance] = useState(0);
  const [currentPace, setCurrentPace] = useState(0); // minutes per km
  const { user } = useAuth();
  const { theme } = useTheme();

  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [trackingState, setTrackingState] = useState<TrackingState>('idle');
  const [currentRoute, setCurrentRoute] = useState<GeoPoint[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activityType, setActivityType] = useState<ActivityType>('walk');

  const timerRef = useRef<any>(null); // holds timeout id
  const startEpochRef = useRef<number | null>(null); // ms since epoch when tracking started

  // Update elapsed time while tracking (robust setTimeout loop)
  useEffect(() => {
    const runTickLoop = () => {
      if (trackingState !== 'tracking' || !startTime) return;
      const seconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
      setElapsedTime(seconds);
      console.log(
        `[Track] Timer tick -> time: ${seconds}s (${locationUtils.formatDuration(seconds)}), distance: ${locationUtils.formatDistance(currentDistance)}`
      );
      timerRef.current = setTimeout(runTickLoop, 1000);
    };

    if (trackingState === 'tracking' && startTime) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      // start immediately
      runTickLoop();
      console.log('[Track] Timer timeout loop started');
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        console.log('[Track] Timer timeout cleared');
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [trackingState, startTime]);

  // Update pace when distance changes
  useEffect(() => {
    if (trackingState === 'tracking' && startTime && currentDistance > 0) {
      const seconds = Math.max(1, Math.floor((Date.now() - startTime.getTime()) / 1000));
      const distanceInKm = currentDistance / 1000;
      if (distanceInKm > 0) {
        const pace = (seconds / 60) / distanceInKm; // min/km
        setCurrentPace(pace);
      }
    }
  }, [currentDistance, trackingState, startTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [locationSubscription]);

  const startTracking = async () => {
    if (!hasLocationPermission) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasLocationPermission(granted);
      if (!granted) {
        Alert.alert('Permission Required', 'Location permission is required to start tracking.');
        return;
      }
      // Permission just granted; continue to start tracking without requiring another tap
    }

    try {
      // Get initial position
      const initialLocation = await locationUtils.getCurrentLocation();
      if (!initialLocation) {
        Alert.alert('Error', 'Unable to get your current location');
        return;
      }

      // Start timer immediately
      const start = new Date();
      startEpochRef.current = start.getTime();
      setStartTime(start);
      setElapsedTime(0);
      setTrackingState('tracking');
      console.log('[Track] Timer started at', start.toISOString());

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
            if (newRoute.length > 1) {
              const totalDistance = locationUtils.calculateTotalDistance(newRoute);
              setCurrentDistance(totalDistance);
              if (startTime) {
                const seconds = Math.max(1, Math.floor((Date.now() - startTime.getTime()) / 1000));
                const km = totalDistance / 1000;
                if (km > 0) setCurrentPace((seconds / 60) / km);
              }
              console.log(
                `[Track] Location update -> points: ${newRoute.length}, distance: ${locationUtils.formatDistance(totalDistance)}`
              );
            }
            return newRoute;
          });
        }
      );

      setLocationSubscription(subscription);
      setCurrentRoute([initialLocation]);
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
    
    // Stop the timer during pause
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    setTrackingState('paused');
    console.log('[Track] Paused tracking');
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
          
          setCurrentRoute(prev => {
            const newRoute = [...prev, geoPoint];
            if (newRoute.length > 1) {
              const totalDistance = locationUtils.calculateTotalDistance(newRoute);
              setCurrentDistance(totalDistance);
              if (startTime) {
                const seconds = Math.max(1, Math.floor((Date.now() - startTime.getTime()) / 1000));
                const km = totalDistance / 1000;
                if (km > 0) setCurrentPace((seconds / 60) / km);
              }
            }
            return newRoute;
          });
        }
      );

      setLocationSubscription(subscription);
      setTrackingState('tracking');
    } catch (error) {
      console.error('Failed to resume tracking:', error);
    }
  };

  const stopTracking = () => {
    // Clean up location subscription immediately
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    
    // Stop the timer but keep the state for saving
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    setTrackingState('idle');
    console.log('[Track] Stopped tracking - showing save dialog');

    if (elapsedTime < 60) { // Less than 1 minute
      Alert.alert(
        'Activity Too Short',
        'Your activity must be at least 1 minute long to save. Would you like to discard it?',
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
      // Ensure user exists in public.users table
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (userCheckError && userCheckError.code === 'PGRST116') {
        // User doesn't exist, create them
        console.log('[Track] Creating user record in public.users table');
        const { error: userCreateError } = await supabase
          .from('users')
          .insert([{
            id: user.id,
            username: user.username || 'user',
            email: user.email || 'unknown@example.com',
            password_hash: 'supabase_auth', // Placeholder since auth is handled by Supabase Auth
          }]);
        
        if (userCreateError) {
          console.error('[Track] Failed to create user:', userCreateError);
          throw new Error(`Failed to create user record: ${userCreateError.message}`);
        }
      } else if (userCheckError) {
        console.error('[Track] User check error:', userCheckError);
        throw new Error(`User verification failed: ${userCheckError.message}`);
      }

      const endTime = new Date();
      const elevationGain = locationUtils.calculateElevationGain(currentRoute);
      const typeMap: Record<ActivityType, string> = {
        walk: 'walking',
        jog: 'running',
        bicycle: 'cycling',
      };
      
      const activityData = {
        user_id: user.id,
        title: `${user.username || 'User'}'s ${typeMap[activityType]} activity`,
        description: `Tracked ${typeMap[activityType]} covering ${locationUtils.formatDistance(currentDistance)}`,
        type: typeMap[activityType],
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration: elapsedTime,
        distance: Math.round(currentDistance), // Convert to integer meters
        elevation_gain: Math.round(elevationGain || 0), // Convert to integer meters
        avg_pace: Math.round(currentPace * 60), // Convert to seconds per km, integer
        route: {
          type: 'LineString',
          coordinates: currentRoute.map(point => [point.longitude, point.latitude, point.altitude || 0]),
          properties: {
            timestamps: currentRoute.map(point => point.timestamp)
          }
        }, // GeoJSON format
        is_public: true,
      };

      console.log('[Track] Saving activity to Supabase:', activityData);
      
      const { data, error } = await supabase
        .from('activities')
        .insert([activityData])
        .select();

      if (error) {
        console.error('[Track] Supabase insert error:', error);
        throw new Error(`Failed to save activity: ${error.message}`);
      }

      console.log('[Track] Activity saved successfully:', data);
      
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
    // Clean up timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    // Clean up location subscription
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    
    // Reset all state
    setTrackingState('idle');
    setCurrentRoute([]);
    setStartTime(null);
    startEpochRef.current = null;
    setElapsedTime(0);
    setCurrentDistance(0);
    setCurrentPace(0);
    
    console.log('[Track] Reset tracking - all state cleared');
  };

  if (!hasLocationPermission && trackingState === 'idle') {
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
          {/* Prominent live timer */}
          <PaperText
            variant="displaySmall"
            style={{
              color: theme.colors.primary[600] || theme.colors.primary[500],
              marginTop: Spacing.sm,
              fontFamily: 'Inter-Bold',
            }}
          >
            {locationUtils.formatDuration(elapsedTime)}
          </PaperText>
        </View>
        {/* Activity type selector */}
        <View style={{ marginBottom: Spacing.lg }}>
          <SegmentedButtons
            value={activityType}
            onValueChange={(val) => setActivityType(val as ActivityType)}
            buttons={[
              { value: 'walk', label: 'Walk' },
              { value: 'jog', label: 'Jog' },
              { value: 'bicycle', label: 'Bicycle' },
            ]}
          />
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
