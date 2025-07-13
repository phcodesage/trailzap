import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
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
          <MapPin size={48} color={theme.colors.primary[500]} />
          <Text style={[styles.permissionTitle, { color: theme.colors.text }]}>Location Access Required</Text>
          <Text style={[styles.permissionText, { color: theme.colors.secondary[500] }]}>TrailZap needs access to your location to track your fitness activities and create route maps.</Text>
          <Button
            title="Grant Permission"
            onPress={() => {}}
            style={styles.permissionButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Track Activity</Text>
          <Text style={[styles.subtitle, { color: theme.colors.secondary[500] }]}> {/* Subtitle here */} </Text>
        </View>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.mainStat}>
            <Text style={[styles.mainStatValue, { color: theme.colors.primary[500] }]}>0.00</Text>
            <Text style={[styles.mainStatLabel, { color: theme.colors.secondary[500] }]}>Distance (km)</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Zap size={20} color={theme.colors.accent[500]} />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>0</Text>
              <Text style={[styles.statLabel, { color: theme.colors.secondary[500] }]}>Calories</Text>
            </View>
            <View style={styles.statItem}>
              <Clock size={20} color={theme.colors.accent[500]} />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{currentRoute.length}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.secondary[500] }]}>Points</Text>
            </View>
          </View>
        </View>
        {/* Map Placeholder */}
        <View style={styles.mapContainer}>
          <View style={[styles.mapPlaceholder, { backgroundColor: theme.colors.card, borderRadius: BorderRadius.lg }]}>
            <MapPin size={32} color={theme.colors.primary[500]} />
            <Text style={[styles.mapText, { color: theme.colors.secondary[500] }]}> 
              {trackingState === 'idle' 
                ? 'Your route will appear here'
                : `Tracking your route • ${currentRoute.length} points recorded`
              }
            </Text>
          </View>
        </View>
        {/* Controls */}
        <View style={styles.controls}>
          {trackingState === 'idle' && (
            <Button
              title="Start Activity"
              onPress={() => {}}
              size="large"
              style={{ backgroundColor: theme.colors.primary[500] }}
            />
          )}
          {trackingState === 'tracking' && (
            <View style={styles.trackingControls}>
              <Button
                title="Pause"
                onPress={() => {}}
                variant="secondary"
                style={styles.controlButton}
              />
              <Button
                title="Stop"
                onPress={() => {}}
                variant="outline"
                style={styles.controlButton}
              />
            </View>
          )}
          {trackingState === 'paused' && (
            <View style={styles.trackingControls}>
              <Button
                title="Resume"
                onPress={() => {}}
                style={styles.controlButton}
              />
              <Button
                title="Stop"
                onPress={() => {}}
                variant="outline"
                style={styles.controlButton}
              />
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
});
