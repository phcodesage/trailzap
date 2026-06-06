import React, { useMemo, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { useTheme } from '@/contexts/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({
  label,
  error,
  helperText,
  style,
  secureTextEntry,
  ...props
}: InputProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const shouldShowToggle = useMemo(() => !!secureTextEntry, [secureTextEntry]);

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: c.text }]}>{label}</Text>}
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: c.border.medium,
              color: c.text,
              backgroundColor: c.card,
            },
            isFocused && { borderColor: c.primary[500], borderWidth: 2 },
            error && { borderColor: c.error[500] },
            style,
          ]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={c.neutral[400]}
          secureTextEntry={shouldShowToggle ? !isPasswordVisible : undefined}
          {...props}
        />
        {shouldShowToggle && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={
              isPasswordVisible ? 'Hide password' : 'Show password'
            }
            onPress={() => setIsPasswordVisible((v) => !v)}
            style={styles.toggleBtn}
          >
            <Text style={[styles.toggleText, { color: c.primary[500] }]}>
              {isPasswordVisible ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={[styles.errorText, { color: c.error[500] }]}>{error}</Text>
      )}
      {helperText && !error && (
        <Text style={[styles.helperText, { color: c.text }]}>{helperText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    minHeight: 46,
  },
  toggleBtn: {
    position: 'absolute',
    right: Spacing.sm,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  toggleText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    marginTop: Spacing.xs,
  },
  helperText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    marginTop: Spacing.xs,
  },
});
