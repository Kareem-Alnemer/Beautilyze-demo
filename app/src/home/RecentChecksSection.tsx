import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '../components/ui/Text';
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
  onCheckSelect, onViewAllPress, limit = 3,
}) => {
  const router = useRouter();
  const userId = useProfileStore((s) => s.user_id);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>Recent Checks</Text>
        {userId && <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="View all recent checks"
          style={styles.viewAllButton}
          onPress={onViewAllPress ?? (() => router.push('/history'))}
        >
          <Text style={styles.link}>View All</Text>
        </TouchableOpacity>}
      </View>
      {userId ? <RecentChecksList
        userId={userId}
        limit={limit}
        showHeading={false}
        onCheckSelect={onCheckSelect ?? ((check) => router.push(`/verdict/${check.product_id}`))}
        renderEmpty={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No checks yet</Text>
            <TouchableOpacity accessibilityRole="button" style={styles.viewAllButton} onPress={() => router.push('/search')}>
              <Text style={styles.link}>Find a product</Text>
            </TouchableOpacity>
          </View>
        )}
      /> : <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No saved checks on this device.</Text>
        <Text style={styles.body}>Sign in to see your recent product checks.</Text>
      </View>}
    </View>
  );
};

const styles = StyleSheet.create({
  body: {
    color: theme.colors.text.secondary, fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
  },
  container: { marginBottom: theme.spacing.xl },
  emptyContainer: { gap: theme.spacing.sm, paddingVertical: theme.spacing.lg },
  emptyTitle: {
    color: theme.colors.text.secondary, fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
  },
  header: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  link: {
    color: theme.colors.text.primary, fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md, textDecorationLine: 'underline',
  },
  sectionTitle: {
    color: theme.colors.text.primary, fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.lg, fontWeight: theme.typography.weight.semibold,
  },
  viewAllButton: { justifyContent: 'center', minHeight: theme.spacing.xxxl, paddingVertical: theme.spacing.sm },
});
