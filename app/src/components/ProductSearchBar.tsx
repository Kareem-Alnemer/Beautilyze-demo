import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../theme';
import { searchProducts, SearchResult } from '../catalog/api';

interface ProductSearchBarProps {
  onProductSelect: (product: SearchResult) => void;
  placeholder?: string;
}

/**
 * Search bar with debounced query to Supabase products table.
 * Renders results list with 40x40 thumbnail if image_url present.
 * Per Phase 1 locked decisions.
 */
export const ProductSearchBar: React.FC<ProductSearchBarProps> = ({
  onProductSelect,
  placeholder = 'Search products...',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const data = await searchProducts(query);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = useCallback(
    (product: SearchResult) => {
      onProductSelect(product);
      setQuery('');
      setResults([]);
      setShowResults(false);
    },
    [onProductSelect]
  );

  const renderItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleSelect(item)}
      accessibilityLabel={`${item.brand} ${item.name}`}
    >
      {item.image_url ? (
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: item.image_url }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        </View>
      ) : (
        <View style={[styles.thumbnailContainer, styles.placeholderThumbnail]}>
          <Text style={styles.placeholderIcon}>📦</Text>
        </View>
      )}
      <View style={styles.resultInfo}>
        <Text style={styles.resultName}>{item.name}</Text>
        <Text style={styles.resultBrand}>{item.brand}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          setShowResults(true);
        }}
        onFocus={() => setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
        placeholderTextColor={theme.colors.text.tertiary}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {loading && <ActivityIndicator style={styles.loading} size="small" color={theme.colors.text.tertiary} />}
      {showResults && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={results}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.resultsList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No products found</Text>
              </View>
            }
          />
        </View>
      )}
    </View>
  );
};

// Need to import Image
import { Image } from 'react-native';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  emptyText: {
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
  },
  input: {
    backgroundColor: theme.colors.surface.raised,
    borderColor: theme.colors.surface.rule,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    width: '100%',
  },
  loading: {
    marginTop: theme.spacing.sm,
  },
  placeholderIcon: {
    fontSize: 18,
  },
  placeholderThumbnail: {
    backgroundColor: theme.colors.surface.rule,
  },
  resultBrand: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.regular,
    marginTop: 2,
  },
  resultInfo: {
    flex: 1,
  },
  resultItem: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  resultName: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.medium,
  },
  resultsContainer: {
    backgroundColor: theme.colors.surface.raised,
    borderColor: theme.colors.surface.rule,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    elevation: 2,
    left: 0,
    marginTop: theme.spacing.xs,
    position: 'absolute',
    right: 0,
    shadowColor: theme.colors.brand.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    top: '100%',
    zIndex: 10,
  },
  resultsList: {
    paddingVertical: theme.spacing.xs,
  },
  thumbnail: {
    height: 40,
    width: 40,
  },
  thumbnailContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.rule,
    borderRadius: theme.radii.sm,
    height: 40,
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
    overflow: 'hidden',
    width: 40,
  },
});