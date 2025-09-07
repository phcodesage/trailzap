import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthState, User, LoginCredentials, SignupCredentials } from '@/types/auth';
import { authStorage } from '@/utils/authStorage';
import { supabase } from '@/services/supabase';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  signup: (credentials: SignupCredentials) => Promise<{ success: boolean; error?: string }>;
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
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (session?.user) {
          const user: User = {
            id: session.user.id,
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'user',
            email: session.user.email || '',
            bio: session.user.user_metadata?.bio || null,
            location: session.user.user_metadata?.location || null,
            isPrivate: session.user.user_metadata?.isPrivate || false,
            createdAt: session.user.created_at,
            updatedAt: session.user.updated_at || session.user.created_at,
            followers: [],
            following: [],
            totalActivities: 0,
            totalDistance: 0,
            totalDuration: 0,
            joinDate: session.user.created_at,
          };

          setAuthState({
            user,
            token: session.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          await authStorage.saveToken(session.access_token);
          await authStorage.saveUser(user);
        } else {
          setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
          await authStorage.clearAll();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const initializeAuth = async () => {
    try {
      // Get current session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      if (session?.user) {
        // Convert Supabase user to our User type
        const user: User = {
          id: session.user.id,
          username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'user',
          email: session.user.email || '',
          bio: session.user.user_metadata?.bio || null,
          location: session.user.user_metadata?.location || null,
          isPrivate: session.user.user_metadata?.isPrivate || false,
          createdAt: session.user.created_at,
          updatedAt: session.user.updated_at || session.user.created_at,
          followers: [],
          following: [],
          totalActivities: 0,
          totalDistance: 0,
          totalDuration: 0,
          joinDate: session.user.created_at,
        };

        setAuthState({
          user,
          token: session.access_token,
          isAuthenticated: true,
          isLoading: false,
        });
        
        // Save to local storage
        await authStorage.saveToken(session.access_token);
        await authStorage.saveUser(user);
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.identifier,
        password: credentials.password,
      });

      if (error) {
        console.error('Login failed:', error.message);
        
        // Return specific error messages based on Supabase error codes
        let errorMessage = 'Login failed';
        switch (error.message) {
          case 'Invalid login credentials':
            errorMessage = 'Invalid email or password. Please check your credentials and try again.';
            break;
          case 'Email not confirmed':
            errorMessage = 'Please check your email and click the confirmation link before signing in.';
            break;
          case 'Too many requests':
            errorMessage = 'Too many login attempts. Please wait a moment before trying again.';
            break;
          default:
            if (error.message.includes('Invalid login credentials')) {
              errorMessage = 'Invalid email or password. Please check your credentials and try again.';
            } else if (error.message.includes('Email')) {
              errorMessage = 'Please enter a valid email address.';
            } else {
              errorMessage = error.message;
            }
        }
        
        return { success: false, error: errorMessage };
      }

      if (data.user && data.session) {
        // Convert Supabase user to our User type
        const user: User = {
          id: data.user.id,
          username: data.user.user_metadata?.username || data.user.email?.split('@')[0] || 'user',
          email: data.user.email || '',
          bio: data.user.user_metadata?.bio || null,
          location: data.user.user_metadata?.location || null,
          isPrivate: data.user.user_metadata?.isPrivate || false,
          createdAt: data.user.created_at,
          updatedAt: data.user.updated_at || data.user.created_at,
          followers: [],
          following: [],
          totalActivities: 0,
          totalDistance: 0,
          totalDuration: 0,
          joinDate: data.user.created_at,
        };

        setAuthState({
          user,
          token: data.session.access_token,
          isAuthenticated: true,
          isLoading: false,
        });
        
        // Save to local storage
        await authStorage.saveToken(data.session.access_token);
        await authStorage.saveUser(user);
        
        return { success: true };
      }
      
      return { success: false, error: 'Login failed. Please try again.' };
    } catch (error: any) {
      console.error('Login failed:', error);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const signup = async (credentials: SignupCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            username: credentials.username,
          }
        }
      });

      if (error) {
        console.error('Signup failed:', error.message);
        
        // Return specific error messages based on Supabase error codes
        let errorMessage = 'Signup failed';
        switch (error.message) {
          case 'User already registered':
            errorMessage = 'An account with this email already exists. Please try signing in instead.';
            break;
          case 'Password should be at least 6 characters':
            errorMessage = 'Password must be at least 6 characters long.';
            break;
          case 'Signup is disabled':
            errorMessage = 'Account creation is currently disabled. Please contact support.';
            break;
          default:
            if (error.message.includes('already registered')) {
              errorMessage = 'An account with this email already exists. Please try signing in instead.';
            } else if (error.message.includes('password')) {
              errorMessage = 'Password must be at least 6 characters long.';
            } else if (error.message.includes('email')) {
              errorMessage = 'Please enter a valid email address.';
            } else {
              errorMessage = error.message;
            }
        }
        
        return { success: false, error: errorMessage };
      }

      if (data.user) {
        // For signup, user might need email confirmation
        if (data.session) {
          // User is immediately signed in
          const user: User = {
            id: data.user.id,
            username: credentials.username,
            email: credentials.email,
            bio: null,
            location: null,
            isPrivate: false,
            createdAt: data.user.created_at,
            updatedAt: data.user.updated_at || data.user.created_at,
            followers: [],
            following: [],
            totalActivities: 0,
            totalDistance: 0,
            totalDuration: 0,
            joinDate: data.user.created_at,
          };

          setAuthState({
            user,
            token: data.session.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          // Save to local storage
          await authStorage.saveToken(data.session.access_token);
          await authStorage.saveUser(user);
          
          return { success: true };
        } else {
          // User needs to confirm email
          console.log('Please check your email to confirm your account');
          return { success: true, error: 'Account created! Please check your email to confirm your account before signing in.' };
        }
      }
      
      return { success: false, error: 'Signup failed. Please try again.' };
    } catch (error: any) {
      console.error('Signup failed:', error);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
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