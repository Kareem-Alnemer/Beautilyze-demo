import React, { useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { TextInput, Text } from './ui/Text';
import { theme } from '../theme';
import { searchProducts, SearchResult } from '../catalog/api';
import type { SkinType, ConcernTag } from '../verdict/types';
import { Button } from './ui/Button';

const skinOptions: Array<{ value: SkinType; label: string }> = [
  { value: 'dry', label: 'Dry' }, { value: 'normal', label: 'Normal' }, { value: 'oily', label: 'Oily' },
];
const concernOptions: Array<{ value: ConcernTag; label: string }> = [
  { value: 'acne', label: 'Acne' }, { value: 'oil_control', label: 'Oil control' },
  { value: 'hydration', label: 'Hydration' }, { value: 'dryness', label: 'Dryness' },
  { value: 'sensitivity', label: 'Sensitivity' },
];

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
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [skinType, setSkinType] = useState<SkinType>();
  const [concern, setConcern] = useState<ConcernTag>();
  const hasSearch = Boolean(query.trim() || skinType || concern);

  // Debounced search
  useEffect(() => {
    let active = true;
    setResults([]);
    setError(false);
    setLoading(hasSearch);
    const timer = setTimeout(async () => {
      if (!hasSearch) {
        return;
      }
      try {
        const data = skinType || concern
          ? await searchProducts(query, { skinType, concern })
          : await searchProducts(query);
        if (active) setResults(data);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    // Clearing a timer cannot cancel a request that has already started.
    return () => { active = false; clearTimeout(timer); };
  }, [query, skinType, concern, hasSearch, attempt]);

  const handleSelect = useCallback(
    (product: SearchResult) => {
      onProductSelect(product);
      setQuery('');
      setSkinType(undefined);
      setConcern(undefined);
      setResults([]);
      setShowResults(false);
    },
    [onProductSelect]
  );

  const renderItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      accessibilityRole="button"
      onPress={() => handleSelect(item)}
      accessibilityLabel={`${item.brand} ${item.name}. ${item.partial_data === false && item.ingredients_raw?.trim() ? 'Ingredient list available; check the physical label.' : 'Ingredient data incomplete or unavailable.'}${item.ingredients_raw?.trim() ? ` Ingredients: ${item.ingredients_raw}` : ''}`}
    >
      {item.image_url ? (
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: item.image_url }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        </View>
      ) : null}
      <View style={styles.resultInfo}>
        <Text style={styles.resultName}>{item.name}</Text>
        <Text style={styles.resultBrand}>{item.brand}</Text>
        <Text style={styles.resultBrand}>
          {item.partial_data === false && item.ingredients_raw?.trim()
            ? 'Ingredient list available; check the physical label.'
            : 'Ingredient data incomplete or unavailable.'}
        </Text>
        {item.ingredients_raw?.trim() ? (
          <Text style={styles.resultBrand}>Ingredients: {item.ingredients_raw}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Product or brand</Text>
      <TextInput
        accessibilityLabel="Product or brand"
        style={styles.input}
        placeholder={placeholder}
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          setShowResults(true);
        }}
        onFocus={() => setShowResults(true)}
        placeholderTextColor={theme.colors.text.tertiary}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Text style={styles.filterLabel}>Skin type tag</Text>
      <View style={styles.filters} accessibilityRole="radiogroup" accessibilityLabel="Skin type tag">
        {[{ value: undefined, label: 'Any skin type' }, ...skinOptions].map((option) => (
          <TouchableOpacity key={option.label} accessibilityRole="radio"
            accessibilityState={{ checked: skinType === option.value }}
            style={[styles.filter, skinType === option.value && styles.selectedFilter]}
            onPress={() => { setSkinType(option.value); setShowResults(true); }}>
            <Text style={[styles.filterText, skinType === option.value && styles.selectedText]}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.filterLabel}>Concern tag</Text>
      <View style={styles.filters} accessibilityRole="radiogroup" accessibilityLabel="Concern tag">
        {[{ value: undefined, label: 'Any concern' }, ...concernOptions].map((option) => (
          <TouchableOpacity key={option.label} accessibilityRole="radio"
            accessibilityState={{ checked: concern === option.value }}
            style={[styles.filter, concern === option.value && styles.selectedFilter]}
            onPress={() => { setConcern(option.value); setShowResults(true); }}>
            <Text style={[styles.filterText, concern === option.value && styles.selectedText]}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {(skinType || concern) && <Button variant="text" title="Clear filters" onPress={() => {
        setSkinType(undefined); setConcern(undefined);
      }} />}
      {loading && <ActivityIndicator style={styles.loading} size="small" color={theme.colors.text.tertiary} />}
      {showResults && hasSearch && !loading && (
        <View style={styles.resultsContainer}>
          {/* Bounded dropdown (limit 20): plain map, no virtualization. */}
          <View style={styles.resultsList}>
            {!error && results.length > 0 && <Text style={styles.resultBrand}>
              {results.length === 20 ? 'First 20 results. Refine your search for more specific matches.' : `${results.length} products found`}
            </Text>}
            {results.map((item) => (
              <View key={item.id}>{renderItem({ item })}</View>
            ))}
            {error ? (
              <View style={styles.emptyState}>
                <Text accessibilityRole="alert" style={styles.emptyText}>Could not search the catalog.</Text>
                <TouchableOpacity accessibilityRole="button" style={styles.retryButton} onPress={() => setAttempt((value) => value + 1)}>
                  <Text style={styles.label}>Retry search</Text>
                </TouchableOpacity>
              </View>
            ) : results.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No products found</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

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
  filter: {
    backgroundColor: theme.colors.surface.raised, borderRadius: theme.radii.sm,
    justifyContent: 'center', minHeight: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
  },
  filterLabel: {
    color: theme.colors.text.primary, fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm, marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  filterText: { color: theme.colors.text.primary, fontFamily: theme.typography.font.body, fontSize: theme.typography.size.sm },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  input: {
    backgroundColor: theme.colors.surface.raised,
    borderColor: theme.colors.surface.rule,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    minHeight: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    width: '100%',
  },
  label: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    marginBottom: theme.spacing.sm,
  },
  loading: { marginTop: theme.spacing.sm },
  resultBrand: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.regular,
    marginTop: theme.spacing.xs,
  },
  resultInfo: {
    flex: 1,
    minWidth: 0,
  },
  resultItem: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: theme.spacing.xxxl,
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
    marginTop: theme.spacing.xs,
  },
  resultsList: {
    paddingVertical: theme.spacing.xs,
  },
  retryButton: { justifyContent: 'center', minHeight: theme.spacing.xxxl },
  selectedFilter: { backgroundColor: theme.colors.brand.ink },
  selectedText: { color: theme.colors.text.onAccent, textDecorationLine: 'underline' },
  thumbnail: {
    height: theme.spacing.xxxl,
    width: theme.spacing.xxxl,
  },
  thumbnailContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.rule,
    borderRadius: theme.radii.sm,
    height: theme.spacing.xxxl,
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
    overflow: 'hidden',
    width: theme.spacing.xxxl,
  },
});
