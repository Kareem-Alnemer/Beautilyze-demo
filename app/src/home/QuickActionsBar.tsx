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
  container: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface.raised,
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.surface.rule,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.brand.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 140,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.md,
    backgroundColor: `${theme.colors.brand.accent}1A`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  icon: {
    fontSize: 24,
  },
  title: {
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  description: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.normal * theme.typography.size.md,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  arrow: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.brand.accent,
    position: 'absolute',
    bottom: theme.spacing.lg,
    right: theme.spacing.lg,
  },
});