import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../theme';
import { getScanHistory, ScanHistoryItem } from '../catalog/api';
import { useProfileStore } from '../profile/store';

/**
 * HistoryScreen — displays chronological scan/check history.
 * Fetches from Supabase `checks` table with graceful local fallback.
 * Per blueprint §4.2 (should-have) and §9.1.
 */
export const HistoryScreen: React.FC = () => {
  const userId = useProfileStore((state) => state.user_id);
  const [history, setHistory] = React.useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadHistory = React.useCallback(async (isRefresh = false) => {
    if (!userId) {
      setHistory([]);
      setLoading(false);
      if (isRefresh) setRefreshing(false);
      return;
    }

    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const data = await getScanHistory(userId, 50, 0);
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
      // Graceful fallback: keep any existing cached data
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, [userId]);

  React.useEffect(() => {
    loadHistory(false);
  }, [loadHistory]);

  const onRefresh = () => {
    loadHistory(true);
  };

  const formatTimestamp = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ' • ' + date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatSkinType = (skinType: string): string => {
    return skinType.charAt(0).toUpperCase() + skinType.slice(1);
  };

  const formatAcneSeverity = (severity: string): string => {
    return severity.charAt(0).toUpperCase() + severity.slice(1);
  };

  const getAcneSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'clear':
        return theme.colors.badge.acneClear;
      case 'mild':
        return theme.colors.badge.acneMild;
      case 'moderate':
        return theme.colors.badge.acneModerate;
      case 'severe':
        return theme.colors.badge.acneSevere;
      default:
        return theme.colors.text.tertiary;
    }
  };

  const getVerdictColor = (verdict: string): string => {
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
  };

  const formatVerdict = (verdict: string): string => {
    return verdict.charAt(0).toUpperCase() + verdict.slice(1);
  };

  const getCompatibilityScore = (factorsJson: ScanHistoryItem['factors_json']): string => {
    const compatFactors = factorsJson?.compatibility_factors ?? [];
    const passed = compatFactors.filter((f) => f.result === 'pass').length;
    const total = compatFactors.length || 3;
    return `${passed} of ${total} factors matched`;
  };

  const renderItem = ({ item }: { item: ScanHistoryItem }) => (
    <TouchableOpacity
      style={styles.historyCard}
      accessibilityLabel={`${item.product.brand} ${item.product.name}, ${formatVerdict(item.verdict)}`}
    >
      {item.product.image_url ? (
        <Image source={{ uri: item.product.image_url }} style={styles.thumbnail} resizeMode="cover" />
      ) : (
        <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
          <Text style={styles.placeholderIcon}>📦</Text>
        </View>
      )}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.productName}>{item.product.name}</Text>
          <View style={styles.verdictBadge}>
            <Text style={[styles.verdictText, { color: getVerdictColor(item.verdict) }]}>
              {formatVerdict(item.verdict)}
            </Text>
          </View>
        </View>
        <Text style={styles.productBrand}>{item.product.brand}</Text>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: theme.colors.badge.skinType }]}>
            <Text style={styles.badgeText}>Skin: {formatSkinType(
              item.factors_json?.compatibility_factors?.find((f) => f.name === 'skin_type_fit')?.reason?.includes('dry') ? 'Dry' :
              item.factors_json?.compatibility_factors?.find((f) => f.name === 'skin_type_fit')?.reason?.includes('oily') ? 'Oily' :
              item.factors_json?.compatibility_factors?.find((f) => f.name === 'skin_type_fit')?.reason?.includes('normal') ? 'Normal' : '—'
            )}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: getAcneSeverityColor(
            item.factors_json?.compatibility_factors?.find((f) => f.name === 'acne_fit')?.reason?.includes('severe') ? 'severe' :
            item.factors_json?.compatibility_factors?.find((f) => f.name === 'acne_fit')?.reason?.includes('moderate') ? 'moderate' :
            item.factors_json?.compatibility_factors?.find((f) => f.name === 'acne_fit')?.reason?.includes('mild') ? 'mild' : 'clear'
          ) }]}>
            <Text style={styles.badgeText}>Acne: {formatAcneSeverity(
              item.factors_json?.compatibility_factors?.find((f) => f.name === 'acne_fit')?.reason?.includes('severe') ? 'Severe' :
              item.factors_json?.compatibility_factors?.find((f) => f.name === 'acne_fit')?.reason?.includes('moderate') ? 'Moderate' :
              item.factors_json?.compatibility_factors?.find((f) => f.name === 'acne_fit')?.reason?.includes('mild') ? 'Mild' : 'Clear'
            )}</Text>
          </View>
        </View>
        <View style={styles.footerRow}>
          <Text style={styles.timestamp}>{formatTimestamp(item.created_at)}</Text>
          <Text style={[styles.scoreText, { color: theme.colors.text.secondary }]}>
            {getCompatibilityScore(item.factors_json)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand.accent} />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && history.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to Load History</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadHistory(false)}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (history.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Scan History Yet</Text>
          <Text style={styles.emptyText}>
            Your product checks will appear here.
          </Text>
          <Text style={styles.emptySubtext}>
            Search a product or scan your skin to get started.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.brand.accent]}
            progressViewOffset={0}
          />
        }
        testID="history-flatlist"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Scan History Yet</Text>
            <Text style={styles.emptyText}>
              Your product checks will appear here.
            </Text>
            <Text style={styles.emptySubtext}>
              Search a product or scan your skin to get started.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface.base,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    color: theme.colors.text.tertiary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  errorTitle: {
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.brand.accent,
    borderRadius: theme.radii.md,
  },
  retryButtonText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.onAccent,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  historyCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface.raised,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surface.rule,
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: theme.radii.sm,
    marginRight: theme.spacing.md,
  },
  placeholderThumbnail: {
    backgroundColor: theme.colors.surface.rule,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  productName: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  productBrand: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
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
  badgeRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.sm,
  },
  badgeText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text.onAccent,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface.rule,
  },
  timestamp: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.tertiary,
  },
  scoreText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
  },
});