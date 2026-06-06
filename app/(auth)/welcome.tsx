import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Button } from '@/components/Button';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export default function WelcomeScreen() {
  return (
    <ImageBackground
      source={{
        uri: 'https://images.pexels.com/photos/416978/pexels-photo-416978.jpeg?auto=compress&cs=tinysrgb&w=800&h=1200&dpr=1',
      }}
      style={styles.container}
    >
      <LinearGradient
        // Violet brand wash fading into near-black for legible CTAs.
        colors={['rgba(76,29,149,0.45)', 'rgba(24,20,37,0.92)']}
        style={styles.overlay}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.logo}>TrailZap</Text>
              <Text style={styles.tagline}>Track. Share. Conquer.</Text>
            </View>

            <View style={styles.footer}>
              <Text style={styles.description}>
                Join the community of athletes tracking their adventures and
                pushing their limits.
              </Text>

              <View style={styles.buttonContainer}>
                <Button
                  title="Get Started"
                  onPress={() => router.push('/(auth)/signup')}
                  variant="primary"
                  size="large"
                />
                <Button
                  title="I already have an account"
                  onPress={() => router.push('/(auth)/login')}
                  variant="outline"
                  size="large"
                  style={styles.secondaryButton}
                  textStyle={styles.secondaryButtonText}
                />
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 44,
    fontFamily: 'Inter-Bold',
    color: Colors.text.inverse,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.primary[200],
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  footer: {
    paddingBottom: Spacing.xl,
  },
  description: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  buttonContainer: {
    gap: Spacing.sm,
  },
  secondaryButton: {
    borderColor: 'rgba(255,255,255,0.7)',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    color: Colors.text.inverse,
  },
});
