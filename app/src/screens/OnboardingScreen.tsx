import React, { useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from '../components/ui/Text';
import { useRouter } from 'expo-router';
import { theme } from '../theme';
import { useProfileStore } from '../profile/store';
import { SkinTypeSelector } from '../profile/components/SkinTypeSelector';
import { AcneSeveritySelector } from '../profile/components/AcneSeveritySelector';
import { AgeInput } from '../profile/components/AgeInput';
import { AllergyManager } from '../profile/components/AllergyManager';
import { SensitivityManager } from '../profile/components/SensitivityManager';
import { Button } from '../components/ui/Button';

/**
 * OnboardingScreen — first-run baseline form (blueprint §4.2).
 * Locked composition: docs/design/screens/onboarding.md.
 * Writes straight into the profile store (the store is the draft);
 * only skin type is required. Completion is device-local; Supabase
 * sync is best-effort when signed in and never blocks entry.
 */
export const OnboardingScreen: React.FC = () => {
  const router = useRouter();
  const { colors } = theme;
  const [showValidation, setShowValidation] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const pending = useRef(false);

  const userId = useProfileStore((s) => s.user_id);
  const userSkinType = useProfileStore((s) => s.user_skin_type);
  const userAcneSeverity = useProfileStore((s) => s.user_acne_severity);
  const age = useProfileStore((s) => s.age);
  const allergies = useProfileStore((s) => s.allergies);
  const sensitivities = useProfileStore((s) => s.sensitivities);

  const setUserSkinType = useProfileStore((s) => s.setUserSkinType);
  const setUserAcneSeverity = useProfileStore((s) => s.setUserAcneSeverity);
  const setAge = useProfileStore((s) => s.setAge);
  const addAllergy = useProfileStore((s) => s.addAllergy);
  const removeAllergy = useProfileStore((s) => s.removeAllergy);
  const addSensitivity = useProfileStore((s) => s.addSensitivity);
  const removeSensitivity = useProfileStore((s) => s.removeSensitivity);

  const handleSubmit = async () => {
    if (pending.current) return;
    if (!useProfileStore.getState().user_skin_type) {
      setShowValidation(true);
      return;
    }
    setShowValidation(false);
    setSyncError('');
    pending.current = true;
    setSubmitting(true);
    try {
      if (useProfileStore.getState().user_id) {
        await useProfileStore.getState().persistToSupabase();
      }
      await useProfileStore.getState().setHasCompletedOnboarding(true);
      router.replace('/');
    } catch {
      setSyncError("We couldn't save to your account. Your entries remain in this session. Retry or continue without saving.");
    } finally {
      pending.current = false;
      setSubmitting(false);
    }
  };

  const ready = userSkinType !== null && !submitting;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text.primary }]}>Welcome to BeautiLyze</Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Set your baseline once. You can change everything later in Profile.
          </Text>
          {!userId && <Text style={[styles.helper, { color: colors.text.secondary }]}>
            Guest profile: entries last for this session and are not saved to an account.
          </Text>}
        </View>

        <View style={styles.section}>
          <SkinTypeSelector value={userSkinType} onChange={setUserSkinType} label="Skin Type" />
          <Text style={[styles.helper, { color: colors.text.secondary }]}>
            Required. This drives the skin-type fit factor.
          </Text>
        </View>

        <View style={styles.section}>
          <AcneSeveritySelector value={userAcneSeverity} onChange={setUserAcneSeverity} label="Acne Severity" />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Age</Text>
          <AgeInput value={age} onChange={setAge} label="Age" min={13} max={100} />
        </View>

        <View style={styles.section}>
          <SensitivityManager items={sensitivities} onAdd={addSensitivity} onRemove={removeSensitivity} />
          <Text style={[styles.helper, { color: colors.text.secondary }]}>
            Quick chips are available for fragrance and essential oils. Everything else is matched word-for-word against ingredient names.
          </Text>
        </View>

        <View style={styles.section}>
          <AllergyManager items={allergies} onAdd={addAllergy} onRemove={removeAllergy} />
          <Text style={[styles.helper, { color: colors.text.secondary }]}>
            Matched word-for-word against the ingredient list we have. If our list is incomplete, we say so — always check the physical label.
          </Text>
        </View>

        {showValidation && (
          <Text accessibilityRole="alert" style={[styles.notice, { color: colors.verdict.caution }]}>
            Choose your skin type to continue.
          </Text>
        )}
        {syncError ? (
          <Text accessibilityRole="alert" style={[styles.notice, { color: colors.text.primary }]}>{syncError}</Text>
        ) : null}

        <View style={styles.submitContainer}>
          <Button title={submitting ? 'Saving...' : syncError ? 'Retry save' : 'Get started'}
            onPress={handleSubmit} disabled={!ready} busy={submitting} />
          {syncError && <Button title="Continue without saving" variant="text" disabled={submitting} onPress={() => {
            void useProfileStore.getState().setHasCompletedOnboarding(true).then(() => router.replace('/'));
          }} />}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
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
  helper: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.size.sm,
    marginTop: theme.spacing.sm,
  },
  keyboard: { flex: 1 },
  notice: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    marginBottom: theme.spacing.md,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    marginBottom: theme.spacing.sm,
  },
  submitContainer: {
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.xl,
  },
  subtitle: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.size.md,
  },
  title: {
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.xxl,
    fontWeight: theme.typography.weight.semibold,
    marginBottom: theme.spacing.xs,
  },
});
