import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../theme';
import { useProfileStore } from '../profile/store';
import { useVerdict } from '../catalog/useVerdict';
import { useShallow } from 'zustand/react/shallow';
import { VerdictBadge } from '../components/VerdictBadge';
import { ScoreLine } from '../components/ScoreLine';
import { HardConstraintBanner } from '../components/HardConstraintBanner';
import { FactorBreakdownCard } from '../components/FactorBreakdownCard';
import { DisclaimerBlock } from '../components/DisclaimerBlock';

/**
 * VerdictScreen — locked composition per docs/design/screens/verdict.md.
 * Do not redesign without explicit human approval (AGENTS.md §8).
 */
export const VerdictScreen: React.FC = () => {
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const profile = useProfileStore(useShallow((s) => ({
    user_skin_type: s.user_skin_type,
    user_acne_severity: s.user_acne_severity,
    age: s.age,
    allergies: s.allergies,
    sensitivities: s.sensitivities,
  })));

  const { verdict, product, loading, error, refetch } = useVerdict(productId || '', profile);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.text.secondary} />
          <Text style={styles.loadingText}>Checking...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{"We couldn't check this product right now."}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!verdict || !product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Product not found.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const allInsufficient = verdict.compatibility_factors.every((f) => f.result === 'insufficient_data');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Product byline (small, above verdict badge) */}
        <View style={styles.productByline}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productBrand}>{product.brand}</Text>
        </View>

        {/* 1. Verdict badge — the hero */}
        <VerdictBadge verdict={verdict.verdict} summary={verdict.summary} />

        {/* 2. Score line */}
        <ScoreLine score={verdict.score} hardConstraints={verdict.hard_constraints} />

        {/* Insufficient data note */}
        {allInsufficient && (
          <View style={styles.insufficientNote}>
            <Text style={styles.insufficientText}>
              {"We don't have enough information about this product to give a confident answer."}
            </Text>
          </View>
        )}

        {/* 3. Hard constraints block */}
        <HardConstraintBanner hardConstraints={verdict.hard_constraints} />

        {/* 4. Compatibility factors block */}
        <View style={styles.factorsContainer}>
          <Text style={styles.factorsHeading}>Compatibility factors</Text>
          {verdict.compatibility_factors.map((factor, index) => (
            <FactorBreakdownCard key={factor.name} factor={factor} index={index} />
          ))}
        </View>

        {/* 5. Disclaimer (fixed bottom, not scrollable away) */}
        <DisclaimerBlock />

        {/* 6. Primary action */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/search')}
            accessibilityLabel="Check another product"
          >
            <Text style={styles.actionButtonText}>Check another product</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
  },
  actionButtonText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.medium,
    textDecorationLine: 'underline',
  },
  actionContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  container: {
    backgroundColor: theme.colors.surface.base,
    flex: 1,
  },
  errorContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  errorText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  factorsContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  factorsHeading: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: 0.08 * theme.typography.size.xs,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
  },
  insufficientNote: {
    backgroundColor: theme.colors.surface.base,
    borderBottomWidth: 1,
    borderColor: theme.colors.surface.rule,
    borderTopWidth: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  insufficientText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.regular,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.size.sm,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingTop: theme.spacing.xxxl,
  },
  loadingText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.lg,
    marginTop: theme.spacing.md,
  },
  productBrand: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.regular,
    marginTop: 2,
  },
  productByline: {
    paddingBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  productName: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.medium,
  },
  retryButton: {
    backgroundColor: theme.colors.brand.accent,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  retryButtonText: {
    color: theme.colors.text.onAccent,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.medium,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxxl,
  },
});
