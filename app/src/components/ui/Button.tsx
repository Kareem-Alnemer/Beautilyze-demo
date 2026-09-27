import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'text';
  disabled?: boolean;
  busy?: boolean;
  accessibilityLabel?: string;
}

export function Button({ title, onPress, variant = 'primary', disabled = false, busy = false, accessibilityLabel }: ButtonProps) {
  const unavailable = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: unavailable, busy }}
      disabled={unavailable}
      onPress={onPress}
      style={({ pressed }) => [styles.button, variant === 'primary' && styles.primary,
        unavailable && styles.disabled, pressed && (variant === 'primary' ? styles.pressed : styles.disabled)]}
    >
      <Text style={[styles.label, variant === 'primary' ? styles.primaryLabel : styles.textLabel,
        unavailable && styles.disabledLabel]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center', borderRadius: theme.radii.md, justifyContent: 'center',
    minHeight: theme.spacing.xxxl, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md,
  },
  disabled: { backgroundColor: theme.colors.surface.rule },
  disabledLabel: { color: theme.colors.text.secondary },
  label: {
    fontFamily: theme.typography.font.body, fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold, textAlign: 'center',
  },
  pressed: { backgroundColor: theme.colors.text.secondary },
  primary: { backgroundColor: theme.colors.brand.ink },
  primaryLabel: { color: theme.colors.text.onAccent },
  textLabel: { color: theme.colors.text.primary, textDecorationLine: 'underline' },
});
