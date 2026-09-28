import React from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Text } from '../components/ui/Text';
import { theme } from '../theme';
import { ProfileSummaryCard } from './ProfileSummaryCard';
import { QuickActionsBar } from './QuickActionsBar';
import { RecentChecksSection } from './RecentChecksSection';

export const HomeScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.title}>BeautiLyze</Text>
        </View>

        {/* Profile Summary */}
        <ProfileSummaryCard />

        {/* Quick Actions */}
        <QuickActionsBar />

        {/* Recent Checks */}
        <RecentChecksSection limit={3} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface.base,
    flex: 1,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.xxl,
    fontWeight: theme.typography.weight.semibold,
    marginBottom: theme.spacing.xs,
  },
});
