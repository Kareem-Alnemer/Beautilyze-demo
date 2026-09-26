import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { theme } from '../theme';

interface ScoreBarProps {
  label: string;
  category: string;
  confidence: number; // 0 to 1 (e.g. 0.85)
  color: string;
}

export const ScoreBar: React.FC<ScoreBarProps> = ({ label, category, confidence, color }) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const percentage = Math.round(confidence * 100);

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: percentage,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [confidence]);

  const widthInterpolate = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.categoryBadge, { color }]}>{category.toUpperCase()}</Text>
        <Text style={styles.percentage}>{percentage}%</Text>
      </View>

      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: widthInterpolate,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  categoryBadge: { fontSize: 14, fontWeight: '700' },
  container: { marginVertical: 8, width: '100%' },
  fill: { borderRadius: 5, height: '100%' },
  headerRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: theme.colors.text.secondary, fontSize: 14, fontWeight: '500' },
  percentage: { color: theme.colors.text.tertiary, fontSize: 13, fontWeight: '600' },
  track: { backgroundColor: theme.colors.surface.rule, borderRadius: 5, height: 10, overflow: 'hidden' },
});