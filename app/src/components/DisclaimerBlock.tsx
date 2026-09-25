import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

/**
 * Fixed bottom disclaimer block — verbatim from blueprint §10.1.
 * Per docs/design/screens/verdict.md §5.
 */
export const DisclaimerBlock: React.FC = () => {
  const disclaimerText =
    'BeautiLyze is a compatibility-checking tool, not a diagnostic or medical device. It does not replace a dermatologist or professional skincare advice. Verdicts are based on the product information available in our catalog and the profile you provide (AI-estimated or manually set). Allergies are checked against the ingredient list we have; if we don\'t have a complete ingredient list, absence of a detected conflict does not mean a product is safe for you. If you have a known allergy, always check the physical product label before use.';

  return (
    <View style={styles.container}>
      <View style={styles.divider} />
      <Text style={styles.text}>{disclaimerText}</Text>
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
    borderColor: theme.colors.surface.rule,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.surface.rule,
    marginBottom: theme.spacing.sm,
  },
  text: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.regular,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.size.xs,
  },
});