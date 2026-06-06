import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Spacing, BorderRadius } from '@/constants/Spacing';

export default function LoginScreen() {
  const { login } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    identifier?: string;
    password?: string;
    auth?: string;
  }>({});

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
    setErrors((prev) => ({ ...prev, auth: undefined }));

    try {
      const result = await login({ identifier: identifier.trim(), password });
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        setErrors((prev) => ({ ...prev, auth: result.error }));
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        auth: 'An unexpected error occurred. Please try again.',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brand}>
          <View style={[styles.logoBadge, { backgroundColor: c.primary[500] }]}>
            <Text style={styles.logoMark}>TZ</Text>
          </View>
          <Text style={[styles.title, { color: c.text }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: c.neutral[500] }]}>
            Sign in to continue your fitness journey
          </Text>
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
            <View
              style={[
                styles.errorContainer,
                { backgroundColor: c.error[50], borderColor: c.error[200] },
              ]}
            >
              <Text style={[styles.errorText, { color: c.error[600] }]}>
                {errors.auth}
              </Text>
            </View>
          )}

          <Button
            title={isLoading ? 'Signing in...' : 'Sign In'}
            onPress={handleLogin}
            disabled={isLoading}
            size="large"
            style={styles.cta}
          />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: c.neutral[500] }]}>
            Don't have an account?{' '}
            <Text
              style={[styles.link, { color: c.primary[500] }]}
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
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  brand: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  logoMark: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    fontSize: 22,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    marginBottom: Spacing.xs,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  form: {
    marginBottom: Spacing.lg,
  },
  cta: {
    marginTop: Spacing.sm,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  link: {
    fontFamily: 'Inter-SemiBold',
  },
  errorContainer: {
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});
