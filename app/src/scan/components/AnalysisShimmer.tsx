/**
 * Analysis shimmer loading animation.
 * Accessible loading state during inference.
 * Per blueprint §5.1: "Analyzing..." state with clear status feedback.
 */

import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from '../../components/ui/Text';
import { theme } from '../../theme';

interface AnalysisShimmerProps {
  message?: string;
}

export const AnalysisShimmer: React.FC<AnalysisShimmerProps> = ({
  message = 'Analyzing your skin...',
}) => {
  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={theme.colors.brand.accent} />
      <Text style={styles.message}>{message}</Text>
      <View style={styles.shimmerContainer}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.shimmerBar} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.base,
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  message: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.medium,
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },
  shimmerBar: {
    backgroundColor: theme.colors.surface.rule,
    borderRadius: 4,
    height: 8,
    width: 60,
  },
  shimmerContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xl,
  },
});
