import React, { createContext, useContext, useMemo, useState, ReactNode, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';

type ThemeMode = 'light' | 'dark' | 'auto';

const lightTheme = {
  mode: 'light' as const,
  colors: {
    ...Colors,
    background: Colors.background.primary,
    text: Colors.text.primary,
    card: Colors.background.secondary,
    modal: '#fff',
    modalBackdrop: 'rgba(0,0,0,0.25)',
  },
};

const darkTheme = {
  mode: 'dark' as const,
  colors: {
    ...Colors,
    // Dark mode specific overrides
    background: Colors.neutral[900],
    text: Colors.text.inverse,
    card: Colors.neutral[800],
    modal: Colors.neutral[800],
    modalBackdrop: 'rgba(0,0,0,0.8)',
    // Override primary colors for better dark mode contrast
    primary: {
      ...Colors.primary,
      500: '#FF7A47', // Slightly brighter primary for dark mode
    },
    secondary: {
      ...Colors.secondary,
      500: '#5BA3F5', // Brighter secondary for dark mode
    },
    accent: {
      ...Colors.accent,
      500: '#4ADE80', // Brighter accent for dark mode
    },
    // Dark mode neutral overrides
    neutral: {
      ...Colors.neutral,
      50: Colors.neutral[900],
      100: Colors.neutral[800],
      200: Colors.neutral[700],
      300: Colors.neutral[600],
      400: Colors.neutral[500],
      500: Colors.neutral[400],
      600: Colors.neutral[300],
      700: Colors.neutral[200],
      800: Colors.neutral[100],
      900: Colors.neutral[50],
    },
    // Dark mode border colors
    border: {
      light: Colors.neutral[700],
      medium: Colors.neutral[600],
      dark: Colors.neutral[500],
    },
  },
};

interface ThemeContextType {
  theme: typeof lightTheme | typeof darkTheme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  themeMode: 'auto',
  setThemeMode: () => {},
  toggleTheme: () => {},
});

const THEME_STORAGE_KEY = '@trailzap_theme_mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  // Load saved theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
          setThemeModeState(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.log('Failed to load theme preference:', error);
      }
    };
    loadThemePreference();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });
    return () => subscription?.remove();
  }, []);

  // Save theme preference when it changes
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.log('Failed to save theme preference:', error);
      setThemeModeState(mode); // Still update state even if storage fails
    }
  };

  // Determine actual theme based on mode and system preference
  const actualTheme = useMemo(() => {
    if (themeMode === 'auto') {
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return themeMode === 'dark' ? darkTheme : lightTheme;
  }, [themeMode, systemColorScheme]);

  // Legacy toggle function for backward compatibility
  const toggleTheme = () => {
    const newMode = actualTheme.mode === 'dark' ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  const value = useMemo(() => ({
    theme: actualTheme,
    themeMode,
    setThemeMode,
    toggleTheme,
  }), [actualTheme, themeMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}