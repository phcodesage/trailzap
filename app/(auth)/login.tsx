import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export default function LoginScreen() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; auth?: string }>({});

  const validateForm = () => {
    const newErrors: { identifier?: string; password?: string } = {};
    const value = identifier.trim();
    if (!value) {
      newErrors.identifier = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(value)) {
      newErrors.identifier = 'Please enter a valid email address';
    }
    
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors(prev => ({ ...prev, auth: undefined })); // Clear previous auth errors
    
    try {
      const result = await login({ identifier: identifier.trim(), password });
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        setErrors(prev => ({ ...prev, auth: result.error }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, auth: 'An unexpected error occurred. Please try again.' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your fitness journey</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="Enter your email address"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.identifier}
          />
          
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            error={errors.password}
          />
          
          {errors.auth && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errors.auth}</Text>
            </View>
          )}

          <Button
            title={isLoading ? "Signing in..." : "Sign In"}
            onPress={handleLogin}
            disabled={isLoading}
            style={styles.loginButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don't have an account?{' '}
            <Text
              style={styles.link}
              onPress={() => router.push('/(auth)/signup')}
            >
              Sign up
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: Spacing.xl,
  },
  loginButton: {
    marginTop: Spacing.lg,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
  },
  link: {
    color: Colors.primary[500],
    fontFamily: 'Inter-SemiBold',
  },
  errorContainer: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});