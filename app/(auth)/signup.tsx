import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Spacing, BorderRadius } from '@/constants/Spacing';

export default function SignupScreen() {
  const { signup } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors((prev) => ({ ...prev, auth: '' }));

    try {
      const result = await signup({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (result.success) {
        if (result.error) {
          setErrors((prev) => ({ ...prev, auth: result.error || '' }));
        } else {
          router.replace('/(tabs)');
        }
      } else {
        setErrors((prev) => ({ ...prev, auth: result.error || '' }));
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

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
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
          <Text style={[styles.title, { color: c.text }]}>Join TrailZap</Text>
          <Text style={[styles.subtitle, { color: c.neutral[500] }]}>
            Create your account and start tracking
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Username"
            value={formData.username}
            onChangeText={(value) => updateFormData('username', value)}
            placeholder="Choose a username"
            autoCapitalize="none"
            error={errors.username}
          />

          <Input
            label="Email"
            value={formData.email}
            onChangeText={(value) => updateFormData('email', value)}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <Input
            label="Password"
            value={formData.password}
            onChangeText={(value) => updateFormData('password', value)}
            placeholder="Create a password"
            secureTextEntry
            error={errors.password}
          />

          <Input
            label="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(value) => updateFormData('confirmPassword', value)}
            placeholder="Confirm your password"
            secureTextEntry
            error={errors.confirmPassword}
          />

          {errors.auth ? (
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
          ) : null}

          <Button
            title={isLoading ? 'Creating Account...' : 'Create Account'}
            onPress={handleSignup}
            disabled={isLoading}
            size="large"
            style={styles.cta}
          />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: c.neutral[500] }]}>
            Already have an account?{' '}
            <Text
              style={[styles.link, { color: c.primary[500] }]}
              onPress={() => router.push('/(auth)/login')}
            >
              Sign in
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
    paddingVertical: Spacing.xl,
  },
  brand: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
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
