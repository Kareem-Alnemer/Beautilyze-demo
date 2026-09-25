import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { Verdict } from '../verdict/types';

interface HardConstraintBannerProps {
  hardConstraints: Verdict['hard_constraints'];
}

/**
 * Hard constraints block — only shown if any constraint is not 'pass'.
 * Per docs/design/screens/verdict.md §3 and blueprint §6.7, §6.8.
 */
export const HardConstraintBanner: React.FC<HardConstraintBannerProps> = ({
  hardConstraints,
}) => {
  const flagged = hardConstraints.filter((hc) => hc.result !== 'pass');

  if (flagged.length === 0) return null;

  const constraintLabels: Record<string, string> = {
    declared_allergen_conflict: 'Declared-allergen conflict',
    sensitivity: 'Sensitivity',
  };

  const resultColors: Record<string, string> = {
    pass: theme.colors.verdict.match,
    caution: theme.colors.verdict.caution,
    fail: theme.colors.verdict.mismatch,
    insufficient_data: theme.colors.verdict.neutral,
  };

  const resultLabels: Record<string, string> = {
    pass: 'Pass',
    caution: 'Caution',
    fail: 'Mismatch',
    insufficient_data: 'Insufficient data',
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Hard constraints</Text>
      <View style={styles.divider} />
      {flagged.map((hc) => (
        <View key={hc.name} style={styles.row}>
          <View style={styles.iconContainer}>
            <Text style={[styles.icon, { color: resultColors[hc.result] }]}>
              {hc.result === 'pass' ? '✓' : hc.result === 'caution' ? '⚠' : '✕'}
            </Text>
          </View>
          <View style={styles.content}>
            <Text style={styles.name}>{constraintLabels[hc.name] || hc.name}</Text>
            <Text style={[styles.result, { color: resultColors[hc.result] }]}>
              {resultLabels[hc.result] || hc.result}
            </Text>
            {hc.reason && <Text style={styles.reason}>{hc.reason}</Text>}
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface.base,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.surface.rule,
  },
  heading: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text.secondary,
    letterSpacing: 0.08 * theme.typography.size.xs,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.surface.rule,
    marginBottom: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  icon: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
  },
  content: {
    flex: 1,
  },
  name: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  result: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.regular,
    marginBottom: 2,
  },
  reason: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.regular,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.size.sm,
  },
});