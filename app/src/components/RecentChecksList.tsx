import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Text } from './ui/Text';
import { theme } from '../theme';
import { getRecentChecks } from '../catalog/api';

interface RecentCheck {
  id: string;
  product_id: string;
  verdict: string;
  created_at: string;
  product: {
    id: string;
    name: string;
    brand: string;
    image_url: string | null;
  };
}

interface RecentChecksListProps {
  limit?: number;
  renderEmpty?: () => React.ReactNode;
  showHeading?: boolean;
  userId: string;
  onCheckSelect: (check: RecentCheck) => void;
}

/**
 * Recent checks list for SearchScreen.
 * Queries Supabase `checks` table (limit 5) with empty state fallback.
 * Per Phase 1 locked decisions.
 */
export const RecentChecksList: React.FC<RecentChecksListProps> = ({
  userId,
  onCheckSelect,
  limit = 5,
  renderEmpty,
  showHeading = true,
}) => {
  const [checks, setChecks] = React.useState<RecentCheck[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    const loadChecks = async () => {
      setLoading(true);
      setChecks([]);
      setError(false);
      try {
        const data = await getRecentChecks(userId, limit);
        if (active) setChecks(data);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadChecks();
    return () => { active = false; };
  }, [userId, limit, attempt]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading recent checks...</Text>
      </View>
    );
  }

  if (error) return (
    <View style={styles.emptyContainer}>
      <Text accessibilityRole="alert" style={styles.emptyText}>Could not load recent checks.</Text>
      <TouchableOpacity accessibilityRole="button" style={styles.retryButton} onPress={() => setAttempt((value) => value + 1)}>
        <Text style={styles.emptyText}>Retry history</Text>
      </TouchableOpacity>
    </View>
  );
  if (checks.length === 0 && renderEmpty) return <>{renderEmpty()}</>;
  if (checks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No recent checks yet</Text>
        <Text style={styles.emptySubtext}>Search a product to get started</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: RecentCheck }) => (
    <TouchableOpacity
      style={styles.checkItem}
      onPress={() => onCheckSelect(item)}
      accessibilityLabel={`${item.product.brand} ${item.product.name}, ${item.verdict}`}
    >
      {item.product.image_url ? (
        <Image source={{ uri: item.product.image_url }} style={styles.thumbnail} resizeMode="cover" />
      ) : (
        <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
          <Text style={styles.placeholderIcon}>📦</Text>
        </View>
      )}
      <View style={styles.checkInfo}>
        <Text style={styles.checkName}>{item.product.name}</Text>
        <Text style={styles.checkBrand}>{item.product.brand}</Text>
      </View>
      <View style={styles.verdictBadge}>
        <Text style={[styles.verdictText, { color: getVerdictColor(item.verdict) }]}>
          {formatVerdict(item.verdict)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Bounded list (limit <= 5): plain map, no virtualization.
  // (A FlatList here would nest a VirtualizedList inside the parent
  // ScrollView on Search/Home and trigger nesting warnings.)
  return (
    <View style={styles.container}>
      {showHeading && <Text style={styles.sectionTitle}>Recent Checks</Text>}
      <View style={styles.list}>
        {checks.map((item) => (
          <View key={item.id}>{renderItem({ item })}</View>
        ))}
      </View>
    </View>
  );
};

function getVerdictColor(verdict: string): string {
  switch (verdict) {
    case 'match':
      return theme.colors.verdict.match;
    case 'caution':
      return theme.colors.verdict.caution;
    case 'mismatch':
      return theme.colors.verdict.mismatch;
    default:
      return theme.colors.verdict.neutral;
  }
}

function formatVerdict(verdict: string): string {
  return verdict.charAt(0).toUpperCase() + verdict.slice(1);
}

const styles = StyleSheet.create({
  checkBrand: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.regular,
    marginTop: 2,
  },
  checkInfo: {
    flex: 1,
  },
  checkItem: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: theme.colors.surface.rule,
    flexDirection: 'row',
    paddingVertical: theme.spacing.sm,
  },
  checkName: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.medium,
  },
  container: {
    width: '100%',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptySubtext: {
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.medium,
    marginBottom: theme.spacing.xs,
  },
  list: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  loadingText: {
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
  },
  placeholderIcon: {
    fontSize: 18,
  },
  placeholderThumbnail: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.rule,
    justifyContent: 'center',
  },
  retryButton: { justifyContent: 'center', minHeight: theme.spacing.xxxl },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  thumbnail: {
    borderRadius: theme.radii.sm,
    height: 40,
    marginRight: theme.spacing.sm,
    width: 40,
  },
  verdictBadge: {
    backgroundColor: theme.colors.surface.rule,
    borderRadius: theme.radii.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  verdictText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold,
    textTransform: 'capitalize',
  },
});
