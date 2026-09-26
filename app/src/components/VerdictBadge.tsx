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
    backgroundColor: theme.colors.surface.base,
    borderRadius: theme.radii.none,
    borderWidth: 2,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    width: '100%',
  },
  summary: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.regular,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.size.lg,
    textAlign: 'center',
  },
  verdictWord: {
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.xxl,
    fontWeight: theme.typography.weight.semibold,
    lineHeight: theme.typography.lineHeight.tight * theme.typography.size.xxl,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
});