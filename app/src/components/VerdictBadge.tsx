import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { Verdict } from '../verdict/types';

interface VerdictBadgeProps {
  verdict: Verdict['verdict'];
  summary: string;
}

/**
 * Hero verdict badge — full-width block at top of VerdictScreen.
 * Locked composition per docs/design/screens/verdict.md §1.
 */
export const VerdictBadge: React.FC<VerdictBadgeProps> = ({ verdict, summary }) => {
  const verdictColors = {
    match: theme.colors.verdict.match,
    caution: theme.colors.verdict.caution,
    mismatch: theme.colors.verdict.mismatch,
  };

  const verdictLabels = {
    match: 'Match',
    caution: 'Caution',
    mismatch: 'Mismatch',
  };

  const color = verdictColors[verdict];
  const label = verdictLabels[verdict];

  return (
    <View style={[styles.container, { borderColor: color }]}>
      <Text style={[styles.verdictWord, { color: theme.colors.text.primary }]}>{label}</Text>
      <Text style={[styles.summary, { color: theme.colors.text.secondary }]}>{summary}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface.base,
    borderWidth: 2,
    borderRadius: theme.radii.none,
  },
  verdictWord: {
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.xxl,
    fontWeight: theme.typography.weight.semibold,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    lineHeight: theme.typography.lineHeight.tight * theme.typography.size.xxl,
  },
  summary: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.regular,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.normal * theme.typography.size.lg,
  },
});