import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './ui/Text';
import { theme } from '../theme';
import { Icon } from './ui/Icon';
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
      {flagged.map((hc, index) => (
        <View key={`${hc.name}-${index}`} style={styles.row}>
          <View style={styles.iconContainer}>
            <Icon name={hc.result === 'pass' ? 'check' : hc.result === 'caution' ? 'alert-triangle' : hc.result === 'fail' ? 'x' : 'info'} color={resultColors[hc.result]} />
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
    backgroundColor: theme.colors.surface.base,
    borderBottomWidth: 1,
    borderColor: theme.colors.surface.rule,
    borderTopWidth: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    width: '100%',
  },
  content: {
    flex: 1,
  },
  divider: {
    backgroundColor: theme.colors.surface.rule,
    height: 1,
    marginBottom: theme.spacing.sm,
  },
  heading: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: 0.08 * theme.typography.size.xs,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
  },
  iconContainer: {
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    width: 24,
  },
  name: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.medium,
    marginBottom: 2,
  },
  reason: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.regular,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.size.sm,
  },
  result: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.regular,
    marginBottom: 2,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
});
