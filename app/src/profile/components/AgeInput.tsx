import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput } from '../../components/ui/Text';
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
  const { colors } = theme;
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
    if (/^\d+$/.test(newText) && Number.isInteger(num) && num >= min && num <= max) {
      onChange(num);
    }
  };

  const handleBlur = () => {
    if (text === '') {
      onChange(null);
    } else {
      const num = Number(text);
      if (/^\d+$/.test(text) && Number.isInteger(num) && num >= min && num <= max) {
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
          accessibilityLabel={label}
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
          autoComplete="off"
          textContentType="none"
        />
        <Text style={[styles.unit, { color: colors.text.secondary }]}>years</Text>
      </View>
      {text !== '' && (!/^\d+$/.test(text) || !Number.isInteger(Number(text)) || Number(text) < min || Number(text) > max) && (
        <Text accessibilityRole="alert" style={[styles.error, { color: colors.verdict.mismatch }]}>
          Enter a whole number between {min} and {max}.
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
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    marginTop: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.lg,
    minHeight: theme.spacing.xxxl,
    padding: theme.spacing.lg,
  },
  inputDisabled: {
    backgroundColor: theme.colors.surface.base,
  },
  inputWrapper: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.raised,
    borderColor: theme.colors.surface.rule,
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
  },
  label: {
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
    marginBottom: theme.spacing.md,
  },
  unit: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    paddingRight: theme.spacing.lg,
  },
});
