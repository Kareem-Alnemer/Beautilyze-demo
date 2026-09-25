import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
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
}) => {
  const [checks, setChecks] = React.useState<RecentCheck[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadChecks = async () => {
      setLoading(true);
      try {
        const data = await getRecentChecks(userId, 5);
        setChecks(data);
      } catch {
        setChecks([]);
      } finally {
        setLoading(false);
      }
    };
    loadChecks();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading recent checks...</Text>
      </View>
    );
  }

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

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Recent Checks</Text>
      <FlatList
        data={checks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

function getVerdictColor(verdict: string): string {
  switch (verdict) {
    case 'match':
      return '#3D8B5F';
    case 'caution':
      return '#D98C2B';
    case 'mismatch':
      return '#C43F3B';
    default:
      return '#6B6259';
  }
}

function formatVerdict(verdict: string): string {
  return verdict.charAt(0).toUpperCase() + verdict.slice(1);
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  sectionTitle: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  list: {
    paddingHorizontal: theme.spacing.lg,
  },
  loadingContainer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    color: theme.colors.text.tertiary,
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.tertiary,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderColor: theme.colors.surface.rule,
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.sm,
    marginRight: theme.spacing.sm,
  },
  placeholderThumbnail: {
    backgroundColor: theme.colors.surface.rule,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 18,
  },
  checkInfo: {
    flex: 1,
  },
  checkName: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text.primary,
  },
  checkBrand: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.regular,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  verdictBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surface.rule,
  },
  verdictText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold,
    textTransform: 'capitalize',
  },
});