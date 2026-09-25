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
    flex: 1,
    backgroundColor: theme.colors.surface.base,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  header: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.xxl,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.size.md,
  },
  searchSection: {
    marginBottom: theme.spacing.xl,
  },
  recentSection: {
    // RecentChecksList handles its own padding
  },
});