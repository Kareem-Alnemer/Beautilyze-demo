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
  const generation = React.useRef(0);
  const [error, setError] = React.useState<string | null>(null);

  const loadHistory = React.useCallback(async (isRefresh = false) => {
    const request = ++generation.current;
    if (!userId) {
      setError(null);
      setHistory([]);
      setLoading(false);
      if (isRefresh) setRefreshing(false);
      return;
    }

    try {
      if (!isRefresh) { setLoading(true); setHistory([]); }
      else setRefreshing(true);
      setError(null);
      const data = await getScanHistory(userId, 50, 0);
      if (request === generation.current) setHistory(data);
    } catch (err) {
      if (request === generation.current) setError(err instanceof Error ? err.message : 'Failed to load history');
      // Graceful fallback: keep any existing cached data
    } finally {
      if (request === generation.current) { setLoading(false); setRefreshing(false); }
    }
  }, [userId]);

  React.useEffect(() => {
    void loadHistory(false);
    return () => { generation.current++; };
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
    if (compatFactors.length !== 3) return 'Compatibility details unavailable';
    const total = compatFactors.length;
    return `${passed} of ${total} factors matched`;
  };

  const renderItem = ({ item }: { item: ScanHistoryItem }) => (
    <View
      style={styles.historyCard}
      accessibilityLabel={`${item.product.brand} ${item.product.name}, ${formatVerdict(item.verdict)}`}
    >
      {item.product.image_url ? (
        <Image source={{ uri: item.product.image_url }} style={styles.thumbnail} resizeMode="cover" />
      ) : null}
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
        <View style={styles.footerRow}>
          <Text style={styles.timestamp}>{formatTimestamp(item.created_at)}</Text>
          <Text style={[styles.scoreText, { color: theme.colors.text.secondary }]}>
            {getCompatibilityScore(item.factors_json)}
          </Text>
        </View>
      </View>
    </View>
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
          <Text style={styles.emptyTitle}>No Product Checks Yet</Text>
          <Text style={styles.emptyText}>
            Your product checks will appear here.
          </Text>
          <Text style={styles.emptySubtext}>
            Search a product to get started.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={history}
        ListHeaderComponent={error ? <Text accessibilityRole="alert" style={styles.errorText}>Could not refresh. Showing previously loaded checks.</Text> : null}
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
            <Text style={styles.emptyTitle}>No Product Checks Yet</Text>
            <Text style={styles.emptyText}>
              Your product checks will appear here.
            </Text>
            <Text style={styles.emptySubtext}>
              Search a product to get started.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  container: {
    backgroundColor: theme.colors.surface.base,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  emptySubtext: {
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    textAlign: 'center',
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  emptyTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    marginBottom: theme.spacing.sm,
  },
  errorContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  errorTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    marginBottom: theme.spacing.sm,
  },
  footerRow: {
    alignItems: 'flex-start',
    borderTopColor: theme.colors.surface.rule,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
  },
  historyCard: {
    backgroundColor: theme.colors.surface.raised,
    borderColor: theme.colors.surface.rule,
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  listContent: {
    paddingBottom: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    marginTop: theme.spacing.md,
  },
  productBrand: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    marginBottom: theme.spacing.sm,
  },
  productName: {
    color: theme.colors.text.primary,
    flex: 1,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
    marginRight: theme.spacing.sm,
  },
  retryButton: {
    backgroundColor: theme.colors.brand.accent,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  retryButtonText: {
    color: theme.colors.text.onAccent,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
  },
  scoreText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
  },
  thumbnail: {
    borderRadius: theme.radii.sm,
    height: theme.spacing.xxxl,
    marginRight: theme.spacing.md,
    width: theme.spacing.xxxl,
  },
  timestamp: {
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.xs,
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
