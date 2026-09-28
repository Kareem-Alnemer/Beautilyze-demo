import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from './ui/Text';
import { theme } from '../theme';
import { Icon } from './ui/Icon';
import { Verdict } from '../verdict/types';

interface FactorBreakdownCardProps {
  factor: Verdict['compatibility_factors'][0];
  index: number;
}

/**
 * Collapsible card for each compatibility factor.
 * Per docs/design/screens/verdict.md §4 and blueprint §6.8.
 * Fixed order: 1. Skin-type fit, 2. Acne-concern fit, 3. Age fit
 */
export const FactorBreakdownCard: React.FC<FactorBreakdownCardProps> = ({
  factor,
  index,
}) => {
  const [expanded, setExpanded] = useState(false);

  const factorLabels: Record<string, string> = {
    skin_type_fit: 'Skin-type fit',
    acne_fit: 'Acne-concern fit',
    age_fit: 'Age fit',
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

  const label = factorLabels[factor.name] || factor.name;
  const color = resultColors[factor.result];
  const resultLabel = resultLabels[factor.result] || factor.result;

  return (
    <View style={styles.card} testID={`factor-card-${index}`}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        accessibilityLabel={`${label}, ${resultLabel}. ${expanded ? 'Hide' : 'Show'} explanation.`}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={styles.iconContainer}>
          <Icon name={factor.result === 'pass' ? 'check' : factor.result === 'caution' ? 'alert-triangle' : factor.result === 'fail' ? 'x' : 'info'} color={color} />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.name}>{label}</Text>
          <Text style={[styles.result, { color }]}>{resultLabel}</Text>
        </View>
        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} color={theme.colors.text.tertiary} size="sm" />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.reasonContainer}>
          <Text style={styles.reason}>
            {factor.reason}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface.base,
    borderBottomWidth: 1,
    borderColor: theme.colors.surface.rule,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: theme.spacing.xxxl,
  },
  headerContent: {
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    width: 28,
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
  reasonContainer: {
    marginTop: theme.spacing.sm,
    paddingLeft: theme.spacing.lg + theme.spacing.sm + 28,
  },
  result: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.regular,
  },
});
