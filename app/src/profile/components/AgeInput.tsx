import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';

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
  const { colors, spacing } = useTheme();
  const [text, setText] = React.useState(value?.toString() || '');

  React.useEffect(() => {
    if (value !== null) {
      setText(value.toString());
    }
  }, [value]);

  const handleChange = (newText: string) => {
    setText(newText);
    if (newText === '') {
      onChange(null);
      return;
    }
    const num = parseInt(newText, 10);
    if (!isNaN(num) && num >= min && num <= max) {
      onChange(num);
    }
  };

  const handleBlur = () => {
    if (text === '') {
      onChange(null);
    } else {
      const num = parseInt(text, 10);
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
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            { color: colors.text, borderColor: colors.border },
            disabled && styles.inputDisabled,
          ]}
          value={text}
          onChangeText={handleChange}
          onBlur={handleBlur}
          keyboardType="numeric"
          placeholder={`Enter age (${min}-${max})`}
          disabled={disabled}
          maxLength={3}
          autoCompleteType="off"
          textContentType="none"
        />
        <Text style={[styles.unit, { color: colors.textSecondary }]}>years</Text>
      </View>
      {value !== null && (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Age {value} is within the valid range ({min}-{max})
        </Text>
      )}
      {text && (parseInt(text, 10) < min || parseInt(text, 10) > max) && (
        <Text style={[styles.error, { color: colors.error }]}>
          Age must be between {min} and {max}
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderRadius: 12,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 18,
    textAlign: 'center',
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
  },
  unit: {
    paddingRight: 16,
    fontSize: 16,
  },
  hint: {
    marginTop: 8,
    fontSize: 13,
  },
  error: {
    marginTop: 8,
    fontSize: 13,
  },
});