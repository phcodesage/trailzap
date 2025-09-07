import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { supabase } from '../services/supabase';
import { useTheme } from '@/contexts/ThemeContext';

interface GoogleSignInProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function GoogleSignIn({ onSuccess, onError }: GoogleSignInProps) {
  const { theme } = useTheme();

  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'com.anonymous.trailzapfitnessapp://auth/callback',
        },
      });

      if (error) {
        throw error;
      }

      if (data) {
        onSuccess?.();
      }
    } catch (error: any) {
      console.error('Google sign-in failed:', error);
      onError?.(error.message || 'Google sign-in failed');
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.button, { backgroundColor: '#4285F4' }]} 
      onPress={handleGoogleSignIn}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <Text style={styles.googleIcon}>G</Text>
        <Text style={styles.buttonText}>Continue with Google</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    color: '#4285F4',
    width: 24,
    height: 24,
    textAlign: 'center',
    lineHeight: 24,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
