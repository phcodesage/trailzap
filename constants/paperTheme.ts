import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { Colors } from './Colors';

// React Native Paper themes derived from the app's violet palette so that all
// Paper components (Button, Card, FAB, TextInput, etc.) match the rest of the UI.
// Wired to light/dark in app/_layout.tsx via the ThemeContext mode.

export const lightPaperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary[600],
    onPrimary: '#FFFFFF',
    primaryContainer: Colors.primary[100],
    onPrimaryContainer: Colors.primary[900],
    secondary: Colors.secondary[500],
    onSecondary: '#FFFFFF',
    secondaryContainer: Colors.secondary[100],
    onSecondaryContainer: Colors.secondary[900],
    tertiary: Colors.accent[500],
    background: Colors.background.primary,
    onBackground: Colors.text.primary,
    surface: Colors.background.primary,
    onSurface: Colors.text.primary,
    surfaceVariant: Colors.neutral[100],
    onSurfaceVariant: Colors.neutral[600],
    outline: Colors.border.medium,
    outlineVariant: Colors.border.light,
    error: Colors.error[500],
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level1: Colors.background.secondary,
      level2: Colors.neutral[100],
    },
  },
};

export const darkPaperTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Colors.primary[400],
    onPrimary: '#1E1B2E',
    primaryContainer: Colors.primary[800],
    onPrimaryContainer: Colors.primary[100],
    secondary: Colors.secondary[400],
    onSecondary: '#0F1B2E',
    secondaryContainer: Colors.secondary[800],
    onSecondaryContainer: Colors.secondary[100],
    tertiary: Colors.accent[400],
    background: Colors.neutral[900],
    onBackground: '#FFFFFF',
    surface: Colors.neutral[900],
    onSurface: '#FFFFFF',
    surfaceVariant: Colors.neutral[800],
    onSurfaceVariant: Colors.neutral[300],
    outline: Colors.neutral[700],
    outlineVariant: Colors.neutral[800],
    error: Colors.error[400],
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level1: Colors.neutral[800],
      level2: Colors.neutral[800],
    },
  },
};
