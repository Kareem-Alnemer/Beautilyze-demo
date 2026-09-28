import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from './Text';
import { theme } from '../../theme';

interface ChoiceFieldProps<T extends string> {
  label: string;
  value: T | null;
  options: ReadonlyArray<{ value: T; label: string; description: string }>;
  onChange: (value: T | null) => void;
  disabled?: boolean;
}

export function ChoiceField<T extends string>({ label, value, options, onChange, disabled = false }: ChoiceFieldProps<T>) {
  return <View style={styles.container}>
    <Text accessibilityRole="header" style={styles.label}>{label}</Text>
    <View accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((option) => {
        const selected = option.value === value;
        return <Pressable
          key={option.value}
          accessibilityRole="radio"
          accessibilityLabel={`${option.label}. ${option.description}`}
          accessibilityState={{ checked: selected, disabled }}
          disabled={disabled}
          onPress={() => onChange(option.value)}
          style={[styles.option, selected && styles.selected]}
        >
          <View style={styles.headingRow}>
            <Text style={[styles.optionLabel, selected && styles.selectedText]}>{option.label}</Text>
            {selected && <Text style={styles.selectedText}>Selected</Text>}
          </View>
          <Text style={[styles.description, selected && styles.selectedText]}>{option.description}</Text>
        </Pressable>;
      })}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: theme.spacing.sm },
  description: {
    color: theme.colors.text.secondary, fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md, lineHeight: theme.typography.size.md * theme.typography.lineHeight.normal,
  },
  headingRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, justifyContent: 'space-between' },
  label: {
    color: theme.colors.text.primary, fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.lg, fontWeight: theme.typography.weight.semibold,
  },
  option: {
    borderBottomColor: theme.colors.surface.rule, borderBottomWidth: StyleSheet.hairlineWidth,
    gap: theme.spacing.xs, minHeight: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md,
  },
  optionLabel: {
    color: theme.colors.text.primary, fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md, fontWeight: theme.typography.weight.semibold,
  },
  selected: { backgroundColor: theme.colors.brand.ink, borderRadius: theme.radii.md },
  selectedText: { color: theme.colors.text.onAccent, fontFamily: theme.typography.font.body, fontSize: theme.typography.size.md },
});
