import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AcneSeverity } from '../../verdict/types';
import { useTheme } from '../../theme';

interface AcneSeveritySelectorProps {
  value: AcneSeverity | null;
  onChange: (severity: AcneSeverity | null) => void;
  label?: string;
  disabled?: boolean;
}

const ACNE_SEVERITIES: { value: AcneSeverity; label: string; description: string }[] = [
  { value: 'mild', label: 'Mild', description: 'Occasional breakouts' },
  { value: 'moderate', label: 'Moderate', description: 'Regular breakouts, some inflammation' },
  { value: 'severe', label: 'Severe', description: 'Widespread, painful, cystic' },
];

export const AcneSeveritySelector: React.FC<AcneSeveritySelectorProps> = ({
  value,
  onChange,
  label = 'Acne Severity',
  disabled = false,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={styles.options}>
        {ACNE_SEVERITIES.map(({ value, label, description }) => (
          <TouchableOpacity
            key={value}
            onPress={() => !disabled && onChange(value)}
            disabled={disabled}
            style={[
              styles.option,
              value === value && styles.optionSelected,
              disabled && styles.optionDisabled,
            ]}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === value }}
            accessibilityLabel={`${label} acne severity. ${description}`}
          >
            <Text style={[
              styles.optionLabel,
              value === value ? styles.optionLabelSelected : styles.optionLabelDefault,
              disabled && styles.optionLabelDisabled,
            ]}>
              {label}
            </Text>
            <Text style={[
              styles.optionDescription,
              value === value ? styles.optionDescriptionSelected : styles.optionDescriptionDefault,
            ]}>
              {description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {value && (
        <Text style={[styles.currentValue, { color: colors.textSecondary }]}>
          Selected: {value.charAt(0).toUpperCase() + value.slice(1)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  options: {
    flexDirection: 'row',
    gap: 12,
  },
  option: {
    flex: 1,
    padding: 16,
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  optionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E8F0FE',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  optionLabelSelected: {
    color: '#007AFF',
  },
  optionLabelDefault: {
    color: '#1A1A1A',
  },
  optionLabelDisabled: {
    color: '#999',
  },
  optionDescription: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  optionDescriptionSelected: {
    color: '#007AFF',
  },
  optionDescriptionDefault: {
    color: '#666',
  },
  currentValue: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
});