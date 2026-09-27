import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';

interface ChipManagerProps {
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (item: string) => void;
  label: string;
  placeholder: string;
  suggestions?: string[];
  disabled?: boolean;
}

export const ChipManager: React.FC<ChipManagerProps> = ({
  items,
  onAdd,
  onRemove,
  label,
  placeholder,
  suggestions = [],
  disabled = false,
}) => {
  const { colors } = theme;
  const [inputText, setInputText] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const filteredSuggestions = inputText.trim() ? suggestions
    .filter((s) => s.toLowerCase().includes(inputText.trim().toLowerCase()))
    .filter((s) => !items.some((item) => item.trim().toLowerCase() === s.toLowerCase())) : [];

  const handleAdd = () => {
    const trimmed = inputText.trim().toLowerCase();
    if (!disabled && trimmed && !items.some((item) => item.trim().toLowerCase() === trimmed)) {
      onAdd(trimmed);
      setInputText('');
      setShowSuggestions(false);
    }
  };

  const handleRemove = (item: string) => {
    onRemove(item);
  };

  const handleSuggestionPress = (suggestion: string) => {
    if (disabled) return;
    onAdd(suggestion);
    setInputText('');
    setShowSuggestions(false);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text.primary }]}>{label}</Text>

      <View style={styles.chipsContainer}>
        {items.map((item) => (
          <View key={item} style={styles.chip}>
            <Text style={styles.chipText}>{item}</Text>
            <TouchableOpacity
              onPress={() => handleRemove(item)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityState={{ disabled }}
              accessibilityLabel={`Remove ${item}`}
              style={styles.chipRemove}
            >
              <Text style={styles.chipRemoveText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.inputWrapper}>
        <TextInput
          accessibilityLabel={label}
          style={[
            styles.input,
            { color: colors.text.primary, borderColor: colors.surface.rule },
            disabled && styles.inputDisabled,
          ]}
          value={inputText}
          onChangeText={(text) => { setInputText(text); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          editable={!disabled}
          autoComplete="off"
          textContentType="none"
          returnKeyType="done"
          onSubmitEditing={handleAdd}
        />
          <TouchableOpacity onPress={handleAdd} style={styles.addButton} accessibilityRole="button" accessibilityLabel={`Add to ${label.toLowerCase()}`} disabled={disabled || !inputText.trim()}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
      </View>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <View style={styles.suggestionsList}>
          {/* Short suggestion list: plain map, no virtualization. */}
          {filteredSuggestions.map((item) => (
            <TouchableOpacity
              key={item}
              accessibilityRole="button"
              accessibilityLabel={`Add ${item}`}
              disabled={disabled}
              onPress={() => handleSuggestionPress(item)}
              style={styles.suggestionItem}
            >
              <Text style={[styles.suggestionText, { color: colors.text.primary }]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {items.length === 0 && (
        <Text style={[styles.emptyHint, { color: colors.text.secondary }]}>
          No {label.toLowerCase()} added yet
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  addButton: {
    justifyContent: 'center',
    minHeight: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  addButtonText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.raised,
    borderRadius: theme.radii.md,
    flexDirection: 'row',
    maxWidth: '100%',
    paddingHorizontal: theme.spacing.md,
  },
  chipRemove: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: theme.spacing.xxxl,
    minWidth: theme.spacing.xxxl,
    padding: theme.spacing.xs,
  },
  chipRemoveText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
  },
  chipText: {
    color: theme.colors.text.primary,
    flexShrink: 1,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    marginRight: theme.spacing.sm,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  container: {
    marginBottom: theme.spacing.lg,
  },
  emptyHint: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    marginTop: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    minHeight: theme.spacing.xxxl,
    minWidth: 0,
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
    paddingHorizontal: theme.spacing.md,
  },
  label: {
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
    marginBottom: theme.spacing.md,
  },
  suggestionItem: {
    borderBottomColor: theme.colors.surface.rule,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: theme.spacing.xxxl,
    padding: theme.spacing.lg,
  },
  suggestionText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
  },
  suggestionsList: {
    backgroundColor: theme.colors.surface.raised,
    borderColor: theme.colors.surface.rule,
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: theme.spacing.sm,
    overflow: 'hidden',
  },
});
