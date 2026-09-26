import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../theme';

interface QuickActionCardProps {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  accessibilityLabel: string;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({
  icon,
  title,
  description,
  onPress,
  accessibilityLabel,
}) => {
  return (
    <TouchableOpacity
      testID={`quick-action-${title.toLowerCase().replace(' ', '-')}`}
      onPress={onPress}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <Text style={styles.arrow}>→</Text>
    </TouchableOpacity>
  );
};

interface QuickActionsBarProps {
  onScanPress?: () => void;
  onSearchPress?: () => void;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  onScanPress,
  onSearchPress,
}) => {
  const router = useRouter();

  const handleScanPress = () => {
    if (onScanPress) {
      onScanPress();
    } else {
      router.push('/scan');
    }
  };

  const handleSearchPress = () => {
    if (onSearchPress) {
      onSearchPress();
    } else {
      router.push('/search');
    }
  };

  return (
    <View style={styles.container}>
      <QuickActionCard
        icon="📷"
        title="Scan Product"
        description="Camera + AI analysis for personalized profile"
        onPress={handleScanPress}
        accessibilityLabel="Scan a product with your camera"
      />
      <QuickActionCard
        icon="🔍"
        title="Search Catalog"
        description="Browse 30+ verified products and check compatibility"
        onPress={handleSearchPress}
        accessibilityLabel="Search the product catalog"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  arrow: {
    bottom: theme.spacing.lg,
    color: theme.colors.brand.accent,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    position: 'absolute',
    right: theme.spacing.lg,
  },
  card: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.raised,
    borderColor: theme.colors.surface.rule,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    elevation: 3,
    flex: 1,
    justifyContent: 'center',
    minHeight: 140,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    shadowColor: theme.colors.brand.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  container: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  description: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.size.md,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    textAlign: 'center',
  },
  icon: {
    fontSize: 24,
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: `${theme.colors.brand.accent}1A`,
    borderRadius: theme.radii.md,
    height: 48,
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    width: 48,
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
});
