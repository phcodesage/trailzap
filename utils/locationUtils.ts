import * as Location from 'expo-location';
import { GeoPoint } from '@/types/activity';

export const locationUtils = {
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Failed to request location permissions:', error);
      return false;
    }
  },

  async getCurrentLocation(): Promise<GeoPoint | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude || undefined,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Failed to get current location:', error);
      return null;
    }
  },

  calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
    const R = 6371000; // Earth's radius in meters
    const lat1Rad = (point1.latitude * Math.PI) / 180;
    const lat2Rad = (point2.latitude * Math.PI) / 180;
    const deltaLatRad = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const deltaLonRad = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  },

  calculateTotalDistance(route: GeoPoint[]): number {
    if (route.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < route.length; i++) {
      totalDistance += this.calculateDistance(route[i - 1], route[i]);
    }
    return totalDistance;
  },

  calculateElevationGain(route: GeoPoint[]): number {
    let totalGain = 0;
    for (let i = 1; i < route.length; i++) {
      const prev = route[i - 1];
      const curr = route[i];
      if (prev.altitude && curr.altitude && curr.altitude > prev.altitude) {
        totalGain += curr.altitude - prev.altitude;
      }
    }
    return totalGain;
  },

  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  },

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  },

  formatPace(pace: number): string {
    const minutes = Math.floor(pace / 60);
    const seconds = Math.round(pace % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  },
};