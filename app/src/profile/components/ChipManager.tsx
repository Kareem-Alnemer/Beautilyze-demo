import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, Keyboard } from 'react-native';
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
  const { colors, spacing } = theme;
  const [inputText, setInputText] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (inputText) {
      const filtered = suggestions
        .filter((s) => s.toLowerCase().includes(inputText.toLowerCase()))
        .filter((s) => !items.includes(s));
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [inputText, items, suggestions]);

  const handleAdd = () => {
    const trimmed = inputText.trim();
    if (trimmed && !items.includes(trimmed)) {
      onAdd(trimmed);
      setInputText('');
      setShowSuggestions(false);
      Keyboard.dismiss();
    }
  };

  const handleRemove = (item: string) => {
    onRemove(item);
  };

  const handleSuggestionPress = (suggestion: string) => {
    setInputText(suggestion);
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
          style={[
            styles.input,
            { color: colors.text.primary, borderColor: colors.surface.rule },
            disabled && styles.inputDisabled,
          ]}
          value={inputText}
          onChangeText={setInputText}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          editable={!disabled}
          autoComplete="off"
          textContentType="none"
          returnKeyType="done"
          onSubmitEditing={handleAdd}
        />
        {inputText && !disabled && (
          <TouchableOpacity onPress={handleAdd} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <View style={styles.suggestionsList}>
          <FlatList
            data={filteredSuggestions}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSuggestionPress(item)}
                style={styles.suggestionItem}
              >
                <Text style={[styles.suggestionText, { color: colors.text.primary }]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  addButtonText: {
    color: theme.colors.brand.accent,
    fontSize: theme.typography.size.md,
    fontWeight: '600',
  },
  chip: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.base,
    borderRadius: theme.radii.md,
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  chipRemove: {
    padding: theme.spacing.xs,
  },
  chipRemoveText: {
    color: theme.colors.brand.accent,
    fontSize: theme.typography.size.md,
    fontWeight: 'bold',
  },
  chipText: {
    color: theme.colors.brand.accent,
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
    fontSize: theme.typography.size.sm,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    fontSize: theme.typography.size.md,
    padding: theme.spacing.lg,
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
    paddingHorizontal: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.size.md,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  suggestionItem: {
    borderBottomColor: theme.colors.surface.rule,
    borderBottomWidth: 1,
    padding: theme.spacing.lg,
  },
  suggestionText: {
    fontSize: theme.typography.size.md,
  },
  suggestionsList: {
    backgroundColor: theme.colors.surface.raised,
    borderColor: theme.colors.surface.rule,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    marginTop: theme.spacing.sm,
    overflow: 'hidden',
  },
});
