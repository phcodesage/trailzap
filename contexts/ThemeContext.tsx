import React, { createContext, useContext, useMemo, useState, ReactNode, useEffect } from 'react';
import { Appearance } from 'react-native';
import { Colors } from '@/constants/Colors';

const lightTheme = {
  mode: 'light',
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
  mode: 'dark',
  colors: {
    ...Colors,
    background: Colors.background.dark,
    text: Colors.text.inverse,
    card: Colors.neutral[800],
    modal: Colors.neutral[900],
    modalBackdrop: 'rgba(0,0,0,0.7)',
  },
};

const ThemeContext = createContext({
  theme: lightTheme,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const colorScheme = Appearance.getColorScheme();
  const [theme, setTheme] = useState(colorScheme === 'dark' ? darkTheme : lightTheme);

  useEffect(() => {
    setTheme(colorScheme === 'dark' ? darkTheme : lightTheme);
  }, [colorScheme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev.mode === 'dark' ? lightTheme : darkTheme));
  };

  const value = useMemo(() => ({ theme, toggleTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}