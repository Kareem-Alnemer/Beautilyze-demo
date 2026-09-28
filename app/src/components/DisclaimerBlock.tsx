import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './ui/Text';
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
    backgroundColor: theme.colors.surface.base,
    borderColor: theme.colors.surface.rule,
    borderTopWidth: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    width: '100%',
  },
  divider: {
    backgroundColor: theme.colors.surface.rule,
    height: 1,
    marginBottom: theme.spacing.sm,
  },
  text: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.regular,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.size.xs,
  },
});
