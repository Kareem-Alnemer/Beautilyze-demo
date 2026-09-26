import React from 'react';
import { View, ScrollView, Text, StyleSheet, SafeAreaView } from 'react-native';
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
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Check products against your skin profile
          </Text>
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
    flex: 1,
    backgroundColor: theme.colors.surface.base,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.xxl,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.size.md,
  },
});