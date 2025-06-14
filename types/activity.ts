export interface GeoPoint {
  latitude: number;
  longitude: number;
  altitude?: number;
  timestamp: number;
}

export interface Activity {
  id: string;
  userId: string;
  user: {
    username: string;
    profilePic?: string;
  };
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  duration: number; // in seconds
  distance: number; // in meters
  elevationGain: number; // in meters
  avgPace: number; // seconds per km
  maxSpeed: number; // km/h
  calories: number;
  route: GeoPoint[];
  type: 'running' | 'cycling' | 'walking' | 'hiking';
  isPublic: boolean;
  likes: string[];
  comments: Comment[];
  createdAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  profilePic?: string;
  text: string;
  createdAt: string;
}

export interface ActivityStats {
  totalDistance: number;
  totalDuration: number;
  totalActivities: number;
  avgPace: number;
  totalElevation: number;
  totalCalories: number;
}