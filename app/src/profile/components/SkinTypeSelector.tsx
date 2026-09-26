import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SkinType } from '../../verdict/types';
import { theme } from '../../theme';

interface SkinTypeSelectorProps {
  value: SkinType | null;
  onChange: (type: SkinType | null) => void;
  label?: string;
  disabled?: boolean;
}

const SKIN_TYPES: { value: SkinType; label: string; description: string }[] = [
  { value: 'dry', label: 'Dry', description: 'Tight, flaky, rough' },
  { value: 'normal', label: 'Normal', description: 'Balanced, comfortable' },
  { value: 'oily', label: 'Oily', description: 'Shiny, enlarged pores' },
];

export const SkinTypeSelector: React.FC<SkinTypeSelectorProps> = ({
  value,
  onChange,
  label = 'Skin Type',
  disabled = false,
}) => {
  const { colors, spacing, radii } = theme;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text.primary }]}>{label}</Text>
      <View style={styles.options}>
        {SKIN_TYPES.map(({ value: optionValue, label, description }) => (
          <TouchableOpacity
            key={optionValue}
            onPress={() => !disabled && onChange(optionValue)}
            disabled={disabled}
            style={[
              styles.option,
              value === optionValue && styles.optionSelected,
              disabled && styles.optionDisabled,
            ]}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === optionValue }}
            accessibilityLabel={`${label} skin type. ${description}`}
          >
            <Text style={[
              styles.optionLabel,
              value === optionValue ? styles.optionLabelSelected : styles.optionLabelDefault,
              disabled && styles.optionLabelDisabled,
            ]}>
              {label}
            </Text>
            <Text style={[
              styles.optionDescription,
              value === optionValue ? styles.optionDescriptionSelected : styles.optionDescriptionDefault,
            ]}>
              {description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {value && (
        <Text style={[styles.currentValue, { color: colors.text.secondary }]}>
          Selected: {value.charAt(0).toUpperCase() + value.slice(1)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  currentValue: {
    fontSize: theme.typography.size.sm,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  label: {
    fontSize: theme.typography.size.md,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  option: {
    backgroundColor: theme.colors.surface.raised,
    borderRadius: theme.radii.md,
    borderWidth: 2,
    flex: 1,
    padding: theme.spacing.lg,
  },
  optionDescription: {
    fontSize: theme.typography.size.xs,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  optionDescriptionDefault: {
    color: theme.colors.text.secondary,
  },
  optionDescriptionSelected: {
    color: theme.colors.brand.accent,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionLabel: {
    fontSize: theme.typography.size.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  optionLabelDefault: {
    color: theme.colors.text.primary,
  },
  optionLabelDisabled: {
    color: theme.colors.text.secondary,
  },
  optionLabelSelected: {
    color: theme.colors.brand.accent,
  },
  optionSelected: {
    backgroundColor: theme.colors.surface.base,
    borderColor: theme.colors.brand.accent,
  },
  options: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
});
