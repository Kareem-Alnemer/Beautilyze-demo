import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';

interface AgeInputProps {
  value: number | null;
  onChange: (age: number | null) => void;
  label?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
}

export const AgeInput: React.FC<AgeInputProps> = ({
  value,
  onChange,
  label = 'Age',
  disabled = false,
  min = 13,
  max = 100,
}) => {
  const { colors, spacing } = theme;
  const [text, setText] = React.useState(value?.toString() || '');

  React.useEffect(() => {
    setText(value?.toString() ?? '');
  }, [value]);

  const handleChange = (newText: string) => {
    setText(newText);
    if (newText === '') {
      onChange(null);
      return;
    }
    const num = Number(newText);
    if (!isNaN(num) && num >= min && num <= max) {
      onChange(num);
    }
  };

  const handleBlur = () => {
    if (text === '') {
      onChange(null);
    } else {
      const num = Number(text);
      if (!isNaN(num) && num >= min && num <= max) {
        onChange(num);
      } else {
        // Reset to last valid value
        setText(value?.toString() || '');
        onChange(value);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text.primary }]}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            { color: colors.text.primary, borderColor: colors.surface.rule },
            disabled && styles.inputDisabled,
          ]}
          value={text}
          onChangeText={handleChange}
          onBlur={handleBlur}
          keyboardType="numeric"
          placeholder={`Enter age (${min}-${max})`}
          editable={!disabled}
          maxLength={3}
          autoComplete="off"
          textContentType="none"
        />
        <Text style={[styles.unit, { color: colors.text.secondary }]}>years</Text>
      </View>
      {value !== null && (
        <Text style={[styles.hint, { color: colors.text.secondary }]}>
          Age {value} is within the valid range ({min}-{max})
        </Text>
      )}
      {text && (Number(text) < min || Number(text) > max) && (
        <Text style={[styles.error, { color: colors.verdict.mismatch }]}>
          Age must be between {min} and {max}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  error: {
    fontSize: theme.typography.size.sm,
    marginTop: theme.spacing.sm,
  },
  hint: {
    fontSize: theme.typography.size.sm,
    marginTop: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.size.lg,
    padding: theme.spacing.lg,
    textAlign: 'center',
  },
  inputDisabled: {
    backgroundColor: theme.colors.surface.base,
  },
  inputWrapper: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.raised,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    flexDirection: 'row',
  },
  label: {
    fontSize: theme.typography.size.md,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  unit: {
    fontSize: theme.typography.size.md,
    paddingRight: theme.spacing.lg,
  },
});
