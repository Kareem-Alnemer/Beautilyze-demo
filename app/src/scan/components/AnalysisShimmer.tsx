/**
 * Analysis shimmer loading animation.
 * Accessible loading state during inference.
 * Per blueprint §5.1: "Analyzing..." state with clear status feedback.
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface.base,
  },
  message: {
    marginTop: theme.spacing.lg,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  shimmerContainer: {
    marginTop: theme.spacing.xl,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  shimmerBar: {
    width: 60,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.surface.rule,
  },
});