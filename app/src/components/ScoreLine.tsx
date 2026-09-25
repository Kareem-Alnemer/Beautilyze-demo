import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { Verdict } from '../verdict/types';

interface ScoreLineProps {
  score: Verdict['score'];
  hardConstraints: Verdict['hard_constraints'];
}

/**
 * Score line — shows compatibility factor count and hard constraint flags.
 * Per docs/design/screens/verdict.md §2 and blueprint §6.6.
 */
export const ScoreLine: React.FC<ScoreLineProps> = ({ score, hardConstraints }) => {
  const flaggedCount = hardConstraints.filter((hc) => hc.result !== 'pass').length;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {score.passed} of {score.total} compatibility factors matched.
      </Text>
      {flaggedCount > 0 && (
        <Text style={styles.text}>
          {flaggedCount} hard constraint{flaggedCount > 1 ? 's' : ''} flagged.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  text: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.regular,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.size.sm,
  },
});