import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../theme';

interface QuickActionsBarProps {
  onScanPress?: () => void;
  onSearchPress?: () => void;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({ onScanPress, onSearchPress }) => {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <TouchableOpacity
        testID="quick-action-search-catalog"
        accessibilityRole="button"
        accessibilityLabel="Search the product catalog"
        style={styles.primary}
        onPress={onSearchPress ?? (() => router.push('/search'))}
      >
        <Text style={styles.primaryText}>Search Catalog</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="quick-action-scan-skin"
        accessibilityRole="button"
        accessibilityLabel="Scan your skin for optional AI estimates"
        style={styles.secondary}
        onPress={onScanPress ?? (() => router.push('/scan'))}
      >
        <Text style={styles.secondaryText}>Scan Skin</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: theme.spacing.sm, marginBottom: theme.spacing.xl },
  primary: {
    alignItems: 'center', backgroundColor: theme.colors.brand.ink,
    borderRadius: theme.radii.md, justifyContent: 'center',
    minHeight: theme.spacing.xxxl, padding: theme.spacing.md,
  },
  primaryText: {
    color: theme.colors.text.onAccent, fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.lg, fontWeight: theme.typography.weight.semibold,
    textAlign: 'center',
  },
  secondary: {
    alignItems: 'center', justifyContent: 'center',
    minHeight: theme.spacing.xxxl, padding: theme.spacing.md,
  },
  secondaryText: {
    color: theme.colors.text.primary, fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md, textAlign: 'center', textDecorationLine: 'underline',
  },
});
