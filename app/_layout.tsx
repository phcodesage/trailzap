import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { PaperProvider } from 'react-native-paper';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import * as NavigationBar from 'expo-navigation-bar';
import { Appearance } from 'react-native';
import { Colors } from '@/constants/Colors';
import { ThemeProvider } from '@/contexts/ThemeContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const setNavBar = () => {
      const colorScheme = Appearance.getColorScheme();
      if (colorScheme === 'dark') {
        NavigationBar.setButtonStyleAsync('light');
      } else {
        NavigationBar.setButtonStyleAsync('dark');
      }
    };
    setNavBar();
    const listener = Appearance.addChangeListener(setNavBar);
    return () => listener.remove();
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <PaperProvider>
      <ThemeProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </AuthProvider>
      </ThemeProvider>
    </PaperProvider>
  );
}
