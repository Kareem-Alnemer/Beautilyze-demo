import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../theme';
import { useProfileStore } from '../profile/store';
import { useVerdict } from '../verdict/hooks/useVerdict';
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
  const profile = useProfileStore((s) => ({
    user_skin_type: s.user_skin_type,
    user_acne_severity: s.user_acne_severity,
    age: s.age,
    allergies: s.allergies,
    sensitivities: s.sensitivities,
  }));

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
          <Text style={styles.errorText}>We couldn't check this product right now.</Text>
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
              We don't have enough information about this product to give a confident answer.
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface.base,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: theme.spacing.xxxl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.lg,
    color: theme.colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  errorText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.brand.accent,
    borderRadius: theme.radii.md,
  },
  retryButtonText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text.onAccent,
  },
  productByline: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  productName: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text.primary,
  },
  productBrand: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.regular,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  insufficientNote: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface.base,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.surface.rule,
  },
  insufficientText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.normal * theme.typography.size.sm,
  },
  factorsContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  factorsHeading: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text.secondary,
    letterSpacing: 0.08 * theme.typography.size.xs,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.sm,
  },
  actionContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionButtonText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text.primary,
    textDecorationLine: 'underline',
  },
});