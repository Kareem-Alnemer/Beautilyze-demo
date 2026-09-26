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
  emptyBody: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.size.md,
    marginBottom: theme.spacing.xl,
    maxWidth: '80%',
    textAlign: 'center',
  },
  emptyCTA: {
    backgroundColor: theme.colors.brand.accent,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  emptyCTAText: {
    color: theme.colors.text.onAccent,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xxxl,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.rule,
    borderRadius: theme.radii.md,
    height: 48,
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    width: 48,
  },
  emptyIconText: {
    fontSize: 24,
  },
  emptyTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
  },
  viewAllButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  viewAllText: {
    color: theme.colors.brand.accent,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.medium,
  },
});
