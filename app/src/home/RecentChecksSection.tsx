import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../theme';
import { useProfileStore } from '../profile/store';
import { RecentChecksList } from '../components/RecentChecksList';

interface RecentChecksSectionProps {
  onCheckSelect?: (check: { product_id: string }) => void;
  onViewAllPress?: () => void;
  limit?: number;
}

export const RecentChecksSection: React.FC<RecentChecksSectionProps> = ({
  onCheckSelect,
  onViewAllPress,
  limit = 3,
}) => {
  const router = useRouter();
  const userId = useProfileStore((s) => s.user_id);

  const handleCheckSelect = (check: { product_id: string }) => {
    if (onCheckSelect) {
      onCheckSelect(check);
    } else {
      router.push(`/verdict/${check.product_id}`);
    }
  };

  const handleViewAllPress = () => {
    if (onViewAllPress) {
      onViewAllPress();
    } else {
      // TODO: Navigate to history screen when implemented
      // router.push('/history');
    }
  };

  const handleScanPress = () => {
    router.push('/scan');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Recent Checks</Text>
        <TouchableOpacity
          onPress={handleViewAllPress}
          style={styles.viewAllButton}
          accessibilityLabel="View all recent checks"
        >
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {userId ? (
        <RecentChecksList
          userId={userId}
          onCheckSelect={handleCheckSelect}
          limit={limit}
          renderEmpty={() => (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>📋</Text>
              </View>
              <Text style={styles.emptyTitle}>No checks yet</Text>
              <Text style={styles.emptyBody}>
                Scan your skin or search the catalog to start checking products.
              </Text>
              <TouchableOpacity
                onPress={handleScanPress}
                style={styles.emptyCTA}
                accessibilityLabel="Scan a product"
              >
                <Text style={styles.emptyCTAText}>Scan Product</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>📋</Text>
          </View>
          <Text style={styles.emptyTitle}>No checks yet</Text>
          <Text style={styles.emptyBody}>
            Sign in to see your recent product checks.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
  },
  viewAllButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  viewAllText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.brand.accent,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface.rule,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyIconText: {
    fontSize: 24,
  },
  emptyTitle: {
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  emptyBody: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.normal * theme.typography.size.md,
    marginBottom: theme.spacing.xl,
    maxWidth: '80%',
  },
  emptyCTA: {
    backgroundColor: theme.colors.brand.accent,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radii.md,
  },
  emptyCTAText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.onAccent,
  },
});