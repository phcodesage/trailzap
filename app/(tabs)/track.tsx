import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Pause, Square, MapPin, Clock, Zap } from 'lucide-react-native';
import * as Location from 'expo-location';
import { Button } from '@/components/Button';
import { locationUtils } from '@/utils/locationUtils';
import { GeoPoint } from '@/types/activity';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { activityAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

type TrackingState = 'idle' | 'tracking' | 'paused';

export default function TrackScreen() {
  const { user } = useAuth();
  const [trackingState, setTrackingState] = useState<TrackingState>('idle');
  const [currentRoute, setCurrentRoute] = useState<GeoPoint[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentDistance, setCurrentDistance] = useState(0);
  const [currentPace, setCurrentPace] = useState(0);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);

  useEffect(() => {
    requestLocationPermission();
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (trackingState === 'tracking' && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [trackingState, startTime]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'TrailZap needs location access to track your activities. Please enable location services in your device settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to request location permission:', error);
    }
  };

  const startTracking = async () => {
    if (!hasLocationPermission) {
      await requestLocationPermission();
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
              setCurrentDistance(totalDistance);
              
              // Calculate pace (minutes per km)
              const timeInMinutes = elapsedTime / 60;
              const distanceInKm = totalDistance / 1000;
              if (distanceInKm > 0) {
                setCurrentPace(timeInMinutes / distanceInKm);
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
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <MapPin size={48} color={Colors.primary[500]} />
          <Text style={styles.permissionTitle}>Location Access Required</Text>
          <Text style={styles.permissionText}>
            TrailZap needs access to your location to track your fitness activities and create route maps.
          </Text>
          <Button
            title="Grant Permission"
            onPress={requestLocationPermission}
            style={styles.permissionButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Track Activity</Text>
          <Text style={styles.subtitle}>
            {trackingState === 'idle' && 'Ready to start your workout'}
            {trackingState === 'tracking' && 'Activity in progress'}
            {trackingState === 'paused' && 'Activity paused'}
          </Text>
        </View>

        {/* Stats Display */}
        <View style={styles.statsContainer}>
          <View style={styles.mainStat}>
            <Text style={styles.mainStatValue}>{locationUtils.formatDuration(elapsedTime)}</Text>
            <Text style={styles.mainStatLabel}>Duration</Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MapPin size={20} color={Colors.primary[500]} />
              <Text style={styles.statValue}>{locationUtils.formatDistance(currentDistance)}</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            
            <View style={styles.statItem}>
              <Zap size={20} color={Colors.secondary[500]} />
              <Text style={styles.statValue}>
                {currentPace > 0 ? locationUtils.formatPace(currentPace * 60) : '--:--'}
              </Text>
              <Text style={styles.statLabel}>Pace</Text>
            </View>
            
            <View style={styles.statItem}>
              <Clock size={20} color={Colors.accent[500]} />
              <Text style={styles.statValue}>{currentRoute.length}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
          </View>
        </View>

        {/* Map Placeholder */}
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <MapPin size={32} color={Colors.primary[500]} />
            <Text style={styles.mapText}>
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
              onPress={startTracking}
              size="large"
              style={styles.startButton}
            />
          )}
          
          {trackingState === 'tracking' && (
            <View style={styles.trackingControls}>
              <Button
                title="Pause"
                onPress={pauseTracking}
                variant="secondary"
                style={styles.controlButton}
              />
              <Button
                title="Stop"
                onPress={stopTracking}
                variant="outline"
                style={styles.controlButton}
              />
            </View>
          )}
          
          {trackingState === 'paused' && (
            <View style={styles.trackingControls}>
              <Button
                title="Resume"
                onPress={resumeTracking}
                style={styles.controlButton}
              />
              <Button
                title="Stop"
                onPress={stopTracking}
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
    backgroundColor: Colors.background.primary,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  
  // Permission styles
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  permissionTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  permissionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  permissionButton: {
    minWidth: 200,
  },
  
  // Header styles
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  
  // Stats styles
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
    color: Colors.primary[500],
  },
  mainStatLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.text.secondary,
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
    color: Colors.text.primary,
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
    marginTop: 2,
  },
  
  // Map styles
  mapContainer: {
    flex: 1,
    marginBottom: Spacing.xl,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  mapText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  
  // Controls styles
  controls: {
    paddingBottom: Spacing.lg,
  },
  startButton: {
    backgroundColor: Colors.primary[500],
  },
  trackingControls: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  controlButton: {
    flex: 1,
  },
});