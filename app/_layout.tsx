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
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { lightPaperTheme, darkPaperTheme } from '@/constants/paperTheme';

SplashScreen.preventAutoHideAsync();

// Inner app: reads the active theme so Paper, the status bar, and the Android
// navigation bar all follow the user's light/dark preference.
function ThemedApp() {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const paperTheme = isDark ? darkPaperTheme : lightPaperTheme;

  useEffect(() => {
    NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
  }, [isDark]);

  return (
    <PaperProvider theme={paperTheme}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar
          style={isDark ? 'light' : 'dark'}
          backgroundColor="transparent"
          translucent
        />
      </AuthProvider>
    </PaperProvider>
  );
}

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

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}
