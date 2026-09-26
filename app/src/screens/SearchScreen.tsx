import React, { useCallback } from 'react';
import { View, ScrollView, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../theme';
import { useProfileStore } from '../profile/store';
import { ProductSearchBar } from '../components/ProductSearchBar';
import { RecentChecksList } from '../components/RecentChecksList';

/**
 * SearchScreen — product search + recent checks list.
 * Per blueprint §5.1 and Phase 1 locked decisions.
 */
export const SearchScreen: React.FC = () => {
  const router = useRouter();
  const userId = useProfileStore((s) => s.user_id); // Will need to add user_id to store

  const handleProductSelect = useCallback(
    (product: { id: string }) => {
      router.push(`/verdict/${product.id}`);
    },
    [router]
  );

  const handleCheckSelect = useCallback(
    (check: { product_id: string }) => {
      router.push(`/verdict/${check.product_id}`);
    },
    [router]
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Check a Product</Text>
          <Text style={styles.subtitle}>Search our catalog to see if it matches your profile</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <ProductSearchBar onProductSelect={handleProductSelect} />
        </View>

        {/* Recent Checks */}
        <View style={styles.recentSection}>
          <RecentChecksList userId={userId || ''} onCheckSelect={handleCheckSelect} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface.base,
    flex: 1,
  },
  header: {
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.xl,
  },
  recentSection: {
    // RecentChecksList handles its own padding
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.lg,
  },
  searchSection: {
    marginBottom: theme.spacing.xl,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.size.md,
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.xxl,
    fontWeight: theme.typography.weight.semibold,
    marginBottom: theme.spacing.xs,
  },
});