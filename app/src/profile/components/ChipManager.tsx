import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, Keyboard } from 'react-native';
import { useTheme } from '../../theme';

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
  const { colors, spacing } = useTheme();
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
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>

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
            { color: colors.text, borderColor: colors.border },
            disabled && styles.inputDisabled,
          ]}
          value={inputText}
          onChangeText={setInputText}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          disabled={disabled}
          autoCompleteType="off"
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
                <Text style={[styles.suggestionText, { color: colors.text }]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {items.length === 0 && (
        <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
          No {label.toLowerCase()} added yet
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
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F0FE',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 6,
  },
  chipRemove: {
    padding: 2,
  },
  chipRemoveText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 16,
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  suggestionsList: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderRadius: 12,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  suggestionItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionText: {
    fontSize: 16,
  },
  emptyHint: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
});