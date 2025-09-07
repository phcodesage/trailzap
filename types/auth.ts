export interface User {
  id: string;
  username: string;
  email: string;
  bio?: string | null;
  location?: string | null;
  isPrivate: boolean;
  profilePic?: string;
  followers: string[];
  following: string[];
  totalActivities: number;
  totalDistance: number;
  totalDuration: number;
  joinDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  identifier: string; // email or username
  password: string;
}

export interface SignupCredentials {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}