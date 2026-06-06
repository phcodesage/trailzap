import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { useTheme } from '@/contexts/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  const variantStyle: ViewStyle =
    variant === 'primary'
      ? { backgroundColor: c.primary[500] }
      : variant === 'secondary'
        ? { backgroundColor: c.secondary[500] }
        : {
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: c.primary[500],
          };

  const variantTextColor = variant === 'outline' ? c.primary[500] : '#FFFFFF';

  const buttonStyle = [
    styles.base,
    variantStyle,
    styles[size],
    disabled && {
      backgroundColor: c.neutral[300],
      borderColor: c.neutral[300],
    },
    style,
  ];

  const titleStyle = [
    styles.baseText,
    styles[`${size}Text`],
    { color: disabled ? c.neutral[500] : variantTextColor },
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <Text style={titleStyle}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sizes
  small: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    minHeight: 32,
  },
  medium: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    minHeight: 44,
  },
  large: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    minHeight: 52,
  },

  // Text
  baseText: {
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
});
