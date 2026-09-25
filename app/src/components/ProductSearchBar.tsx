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
  input: {
    width: '100%',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface.raised,
    borderWidth: 1,
    borderColor: theme.colors.surface.rule,
    borderRadius: theme.radii.md,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    color: theme.colors.text.primary,
  },
  loading: {
    marginTop: theme.spacing.sm,
  },
  resultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: theme.spacing.xs,
    backgroundColor: theme.colors.surface.raised,
    borderWidth: 1,
    borderColor: theme.colors.surface.rule,
    borderRadius: theme.radii.md,
    elevation: 2,
    shadowColor: theme.colors.brand.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  resultsList: {
    paddingVertical: theme.spacing.xs,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  thumbnailContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.sm,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface.rule,
    marginRight: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderThumbnail: {
    backgroundColor: theme.colors.surface.rule,
  },
  thumbnail: {
    width: 40,
    height: 40,
  },
  placeholderIcon: {
    fontSize: 18,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text.primary,
  },
  resultBrand: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.regular,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  emptyState: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    color: theme.colors.text.tertiary,
  },
});