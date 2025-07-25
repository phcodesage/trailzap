export interface User {
  id: string;
  username: string;
  email: string;
  profilePic?: string;
  followers: string[];
  following: string[];
  totalActivities: number;
  totalDistance: number;
  totalDuration: number;
  joinDate: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}