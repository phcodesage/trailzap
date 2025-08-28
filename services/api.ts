import axios from 'axios';
import { authStorage } from '@/utils/authStorage';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await authStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage
      await authStorage.clearAll();
      // You might want to redirect to login here
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: async (credentials: { identifier: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  signup: async (credentials: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    const response = await api.post('/auth/signup', credentials);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  refreshToken: async () => {
    const response = await api.post('/auth/refresh');
    return response.data;
  },
};

// User API calls
export const userAPI = {
  searchUsers: async (query: string) => {
    const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  getUser: async (userId: string) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  updateProfile: async (updates: {
    username?: string;
    bio?: string;
    location?: string;
    isPrivate?: boolean;
  }) => {
    const response = await api.put('/users/profile', updates);
    return response.data;
  },

  getUserStats: async (userId: string) => {
    const response = await api.get(`/users/${userId}/stats`);
    return response.data;
  },
};

// Activity API calls
export const activityAPI = {
  createActivity: async (activityData: {
    title: string;
    description?: string;
    type: string;
    startTime: string;
    endTime: string;
    duration: number;
    distance: number;
    elevationGain?: number;
    avgPace?: number;
    maxSpeed?: number;
    calories?: number;
    route?: any;
    routePoints?: any[];
    weather?: any;
    isPublic?: boolean;
  }) => {
    const response = await api.post('/activities', activityData);
    return response.data;
  },

  getActivities: async (params: {
    page?: number;
    limit?: number;
    type?: string;
    userId?: string;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/activities?${queryParams.toString()}`);
    return response.data;
  },

  getActivity: async (activityId: string) => {
    const response = await api.get(`/activities/${activityId}`);
    return response.data;
  },

  updateActivity: async (activityId: string, updates: {
    title?: string;
    description?: string;
    isPublic?: boolean;
  }) => {
    const response = await api.put(`/activities/${activityId}`, updates);
    return response.data;
  },

  deleteActivity: async (activityId: string) => {
    const response = await api.delete(`/activities/${activityId}`);
    return response.data;
  },

  getUserActivities: async (userId: string, params: {
    page?: number;
    limit?: number;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/activities/user/${userId}?${queryParams.toString()}`);
    return response.data;
  },
};

// Social API calls
export const socialAPI = {
  followUser: async (userId: string) => {
    const response = await api.post(`/social/follow/${userId}`);
    return response.data;
  },

  likeActivity: async (activityId: string) => {
    const response = await api.post(`/social/like/${activityId}`);
    return response.data;
  },

  addComment: async (activityId: string, text: string, parentComment?: string) => {
    const response = await api.post(`/social/comment/${activityId}`, {
      text,
      parentComment,
    });
    return response.data;
  },

  getComments: async (activityId: string, params: {
    page?: number;
    limit?: number;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/social/comments/${activityId}?${queryParams.toString()}`);
    return response.data;
  },

  deleteComment: async (commentId: string) => {
    const response = await api.delete(`/social/comment/${commentId}`);
    return response.data;
  },

  likeComment: async (commentId: string) => {
    const response = await api.post(`/social/comment/${commentId}/like`);
    return response.data;
  },

  getFeed: async (params: {
    page?: number;
    limit?: number;
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/social/feed?${queryParams.toString()}`);
    return response.data;
  },
};

export default api;