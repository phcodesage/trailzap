import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthState, User, LoginCredentials, SignupCredentials } from '@/types/auth';
import { authStorage } from '@/utils/authStorage';
import { authAPI } from '@/services/api';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  signup: (credentials: SignupCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = await authStorage.getToken();
      const user = await authStorage.getUser();
      
      if (token && user) {
        // Verify token is still valid by fetching user data
        try {
          const response = await authAPI.getMe();
          setAuthState({
            user: response.user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
          // Update stored user data
          await authStorage.saveUser(response.user);
        } catch (error) {
          // Token is invalid, clear storage
          await authStorage.clearAll();
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      const response = await authAPI.login(credentials);
      
      await authStorage.saveToken(response.token);
      await authStorage.saveUser(response.user);
      
      setAuthState({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      return true;
    } catch (error: any) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const signup = async (credentials: SignupCredentials): Promise<boolean> => {
    try {
      const response = await authAPI.signup(credentials);
      
      await authStorage.saveToken(response.token);
      await authStorage.saveUser(response.user);
      
      setAuthState({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      return true;
    } catch (error: any) {
      console.error('Signup failed:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authStorage.clearAll();
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const updateUser = (user: User) => {
    setAuthState(prev => ({ ...prev, user }));
    authStorage.saveUser(user);
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        signup,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}