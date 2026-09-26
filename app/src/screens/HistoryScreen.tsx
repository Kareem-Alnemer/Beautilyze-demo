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
  badge: {
    borderRadius: theme.radii.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  badgeText: {
    color: theme.colors.text.onAccent,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
  },
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
    alignItems: 'center',
    borderTopColor: theme.colors.surface.rule,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.xs,
  },
  historyCard: {
    backgroundColor: theme.colors.surface.raised,
    borderColor: theme.colors.surface.rule,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    elevation: 1,
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
  placeholderIcon: {
    fontSize: 24,
  },
  placeholderThumbnail: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.rule,
    justifyContent: 'center',
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
    height: 60,
    marginRight: theme.spacing.md,
    width: 60,
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