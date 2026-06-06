import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Pause, Square, MapPin, Navigation } from 'lucide-react-native';
import * as Location from 'expo-location';
import { locationUtils } from '@/utils/locationUtils';
import { GeoPoint } from '@/types/activity';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { logger } from '@/utils/logger';
import {
  Text as PaperText,
  Card,
  Surface,
  Button as PaperButton,
  SegmentedButtons,
} from 'react-native-paper';

type TrackingState = 'idle' | 'tracking' | 'paused';
type ActivityType = 'walk' | 'jog' | 'bicycle';

// UI type -> Supabase activity_type enum + human label.
const TYPE_TO_ENUM: Record<ActivityType, string> = {
  walk: 'walk',
  jog: 'run',
  bicycle: 'ride',
};
const TYPE_TO_LABEL: Record<ActivityType, string> = {
  walk: 'walking',
  jog: 'running',
  bicycle: 'cycling',
};

export default function TrackScreen() {
  const [locationSubscription, setLocationSubscription] =
    useState<Location.LocationSubscription | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentDistance, setCurrentDistance] = useState(0);
  const [currentPace, setCurrentPace] = useState(0); // minutes per km
  const { user } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;

  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [trackingState, setTrackingState] = useState<TrackingState>('idle');
  const [currentRoute, setCurrentRoute] = useState<GeoPoint[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activityType, setActivityType] = useState<ActivityType>('walk');
  const [isSaving, setIsSaving] = useState(false);

  const timerRef = useRef<any>(null);
  const startEpochRef = useRef<number | null>(null);

  // Update elapsed time while tracking (robust setTimeout loop)
  useEffect(() => {
    const runTickLoop = () => {
      if (trackingState !== 'tracking' || !startTime) return;
      const seconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
      setElapsedTime(seconds);
      timerRef.current = setTimeout(runTickLoop, 1000);
    };

    if (trackingState === 'tracking' && startTime) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      runTickLoop();
    } else if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
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
      const seconds = Math.max(
        1,
        Math.floor((Date.now() - startTime.getTime()) / 1000),
      );
      const distanceInKm = currentDistance / 1000;
      if (distanceInKm > 0) {
        setCurrentPace(seconds / 60 / distanceInKm);
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
        clearTimeout(timerRef.current);
      }
    };
  }, [locationSubscription]);

  const handleLocationUpdate = (location: Location.LocationObject) => {
    const geoPoint: GeoPoint = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitude: location.coords.altitude || undefined,
      timestamp: Date.now(),
    };

    setCurrentRoute((prev) => {
      const newRoute = [...prev, geoPoint];
      if (newRoute.length > 1) {
        const totalDistance = locationUtils.calculateTotalDistance(newRoute);
        setCurrentDistance(totalDistance);
        if (startTime) {
          const seconds = Math.max(
            1,
            Math.floor((Date.now() - startTime.getTime()) / 1000),
          );
          const km = totalDistance / 1000;
          if (km > 0) setCurrentPace(seconds / 60 / km);
        }
      }
      return newRoute;
    });
  };

  const watchOptions: Location.LocationOptions = {
    accuracy: Location.Accuracy.High,
    timeInterval: 5000,
    distanceInterval: 10,
  };

  const startTracking = async () => {
    if (!hasLocationPermission) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasLocationPermission(granted);
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Location permission is required to start tracking.',
        );
        return;
      }
    }

    try {
      const initialLocation = await locationUtils.getCurrentLocation();
      if (!initialLocation) {
        Alert.alert('Error', 'Unable to get your current location');
        return;
      }

      const start = new Date();
      startEpochRef.current = start.getTime();
      setStartTime(start);
      setElapsedTime(0);
      setTrackingState('tracking');

      const subscription = await Location.watchPositionAsync(
        watchOptions,
        handleLocationUpdate,
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
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setTrackingState('paused');
  };

  const resumeTracking = async () => {
    if (!hasLocationPermission) return;
    try {
      const subscription = await Location.watchPositionAsync(
        watchOptions,
        handleLocationUpdate,
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
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setTrackingState('idle');

    if (elapsedTime < 60) {
      Alert.alert(
        'Activity Too Short',
        'Your activity must be at least 1 minute long to save. Would you like to discard it?',
        [
          { text: 'Continue Tracking', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: resetTracking },
        ],
      );
      return;
    }

    Alert.alert(
      'Save Activity',
      `Great workout! You covered ${locationUtils.formatDistance(currentDistance)} in ${locationUtils.formatDuration(elapsedTime)}.`,
      [
        { text: 'Save Activity', onPress: saveActivity },
        { text: 'Discard', style: 'destructive', onPress: resetTracking },
      ],
    );
  };

  const saveActivity = async () => {
    if (!startTime || !user) {
      resetTracking();
      return;
    }

    setIsSaving(true);
    try {
      const elevationGain = locationUtils.calculateElevationGain(currentRoute);
      const distanceMeters = Math.round(currentDistance);
      const movingSeconds = elapsedTime;

      // Profiles are created automatically by the handle_new_user() trigger, so we
      // insert straight into activities. Columns match the Supabase schema.
      const activityData = {
        user_id: user.id,
        activity_type: TYPE_TO_ENUM[activityType],
        title: `${user.username || 'User'}'s ${TYPE_TO_LABEL[activityType]} activity`,
        description: `Tracked ${TYPE_TO_LABEL[activityType]} covering ${locationUtils.formatDistance(currentDistance)}`,
        distance_meters: distanceMeters,
        moving_time_seconds: movingSeconds,
        elapsed_time_seconds: movingSeconds,
        elevation_gain_meters: Math.round(elevationGain || 0),
        average_pace_seconds_per_km:
          currentPace > 0 ? Math.round(currentPace * 60) : null,
        average_speed:
          movingSeconds > 0 ? distanceMeters / movingSeconds : null,
        route: {
          type: 'LineString',
          coordinates: currentRoute.map((p) => [
            p.longitude,
            p.latitude,
            p.altitude || 0,
          ]),
          properties: { timestamps: currentRoute.map((p) => p.timestamp) },
        },
        start_time: startTime.toISOString(),
        visibility: 'everyone',
        status: 'ready',
      };

      logger.debug('Saving activity to Supabase', 'TrackScreen', activityData);

      const { data, error } = await supabase
        .from('activities')
        .insert([activityData])
        .select();
      if (error) {
        console.error('[Track] Supabase insert error:', error);
        throw new Error(error.message);
      }

      logger.info('Activity saved successfully', 'TrackScreen', data);
      Alert.alert(
        'Activity Saved!',
        'Your activity has been saved successfully.',
        [{ text: 'OK', onPress: resetTracking }],
      );
    } catch (error: any) {
      console.error('Failed to save activity:', error);
      Alert.alert(
        'Error',
        `Couldn't save your activity. ${error?.message ?? ''}`.trim(),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const resetTracking = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    setTrackingState('idle');
    setCurrentRoute([]);
    setStartTime(null);
    startEpochRef.current = null;
    setElapsedTime(0);
    setCurrentDistance(0);
    setCurrentPace(0);
  };

  // ---- Derived UI state -----------------------------------------------------
  const status =
    trackingState === 'tracking'
      ? { label: 'Recording', color: c.error[500] }
      : trackingState === 'paused'
        ? { label: 'Paused', color: c.warning[500] }
        : { label: 'Ready to start', color: c.neutral[400] };

  // ---- Permission gate ------------------------------------------------------
  if (!hasLocationPermission && trackingState === 'idle') {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: c.background }]}
      >
        <View style={styles.permissionContainer}>
          <Surface
            style={[
              styles.permissionIconContainer,
              { backgroundColor: c.primary[100] },
            ]}
            elevation={0}
          >
            <Navigation size={40} color={c.primary[500]} />
          </Surface>
          <PaperText
            variant="headlineSmall"
            style={[styles.permissionTitle, { color: c.text }]}
          >
            Location access required
          </PaperText>
          <PaperText
            variant="bodyMedium"
            style={[styles.permissionText, { color: c.neutral[500] }]}
          >
            TrailZap needs your location to track activities and map your
            routes.
          </PaperText>
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
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.content}>
        {/* Hero timer + live status */}
        <View style={styles.hero}>
          <View style={styles.statusRow}>
            <View
              style={[styles.statusDot, { backgroundColor: status.color }]}
            />
            <PaperText
              variant="labelLarge"
              style={{ color: status.color, letterSpacing: 0.5 }}
            >
              {status.label.toUpperCase()}
            </PaperText>
          </View>
          <PaperText style={[styles.heroTimer, { color: c.text }]}>
            {locationUtils.formatDuration(elapsedTime)}
          </PaperText>
        </View>

        {/* Activity type (locked while an activity is in progress) */}
        <SegmentedButtons
          value={activityType}
          onValueChange={(val) => setActivityType(val as ActivityType)}
          style={styles.typeSelector}
          buttons={[
            {
              value: 'walk',
              label: 'Walk',
              icon: 'walk',
              disabled: trackingState !== 'idle',
            },
            {
              value: 'jog',
              label: 'Jog',
              icon: 'run',
              disabled: trackingState !== 'idle',
            },
            {
              value: 'bicycle',
              label: 'Bike',
              icon: 'bike',
              disabled: trackingState !== 'idle',
            },
          ]}
        />

        {/* Stats */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard} elevation={1}>
            <Card.Content style={styles.statContent}>
              <PaperText
                variant="headlineMedium"
                style={[styles.statValue, { color: c.primary[500] }]}
              >
                {locationUtils.formatDistance(currentDistance)}
              </PaperText>
              <PaperText variant="bodySmall" style={{ color: c.neutral[500] }}>
                Distance
              </PaperText>
            </Card.Content>
          </Card>
          <Card style={styles.statCard} elevation={1}>
            <Card.Content style={styles.statContent}>
              <PaperText
                variant="headlineMedium"
                style={[styles.statValue, { color: c.text }]}
              >
                {currentPace > 0 ? currentPace.toFixed(1) : '--'}
              </PaperText>
              <PaperText variant="bodySmall" style={{ color: c.neutral[500] }}>
                Pace (min/km)
              </PaperText>
            </Card.Content>
          </Card>
        </View>

        {/* Route preview placeholder */}
        <Card style={styles.mapCard} elevation={1}>
          <Card.Content style={styles.mapPlaceholder}>
            <MapPin size={28} color={c.primary[400]} />
            <PaperText
              variant="bodyMedium"
              style={[styles.mapText, { color: c.neutral[500] }]}
            >
              {trackingState === 'idle'
                ? 'Your route will appear here'
                : `Recording route · ${currentRoute.length} point${currentRoute.length === 1 ? '' : 's'}`}
            </PaperText>
          </Card.Content>
        </Card>

        {/* Controls */}
        <View style={styles.controls}>
          {trackingState === 'idle' && (
            <PaperButton
              mode="contained"
              onPress={startTracking}
              disabled={isSaving}
              loading={isSaving}
              contentStyle={styles.primaryBtnContent}
              icon={() => <Play size={18} color="#FFFFFF" />}
            >
              {isSaving ? 'Saving...' : 'Start Activity'}
            </PaperButton>
          )}
          {trackingState === 'tracking' && (
            <View style={styles.trackingControls}>
              <PaperButton
                mode="contained-tonal"
                onPress={pauseTracking}
                style={styles.controlButton}
                contentStyle={styles.controlBtnContent}
                icon={() => <Pause size={18} color={c.primary[600]} />}
              >
                Pause
              </PaperButton>
              <PaperButton
                mode="outlined"
                onPress={stopTracking}
                style={styles.controlButton}
                contentStyle={styles.controlBtnContent}
                textColor={c.error[500]}
                icon={() => <Square size={18} color={c.error[500]} />}
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
                contentStyle={styles.controlBtnContent}
                icon={() => <Play size={18} color="#FFFFFF" />}
              >
                Resume
              </PaperButton>
              <PaperButton
                mode="outlined"
                onPress={stopTracking}
                style={styles.controlButton}
                contentStyle={styles.controlBtnContent}
                textColor={c.error[500]}
                icon={() => <Square size={18} color={c.error[500]} />}
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
  // Permission gate
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  permissionIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  permissionTitle: {
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  permissionText: {
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  permissionButton: {
    minWidth: 200,
  },
  // Hero
  hero: {
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroTimer: {
    fontFamily: 'Inter-Bold',
    fontSize: 60,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  typeSelector: {
    marginBottom: Spacing.lg,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
  },
  // Map
  mapCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  mapText: {
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  // Controls
  controls: {
    paddingBottom: Spacing.sm,
  },
  primaryBtnContent: {
    paddingVertical: Spacing.sm,
  },
  trackingControls: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  controlButton: {
    flex: 1,
  },
  controlBtnContent: {
    paddingVertical: Spacing.xs,
  },
});
