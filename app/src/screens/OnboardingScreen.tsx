import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../theme';
import { useProfileStore } from '../profile/store';
import { SkinTypeSelector } from '../profile/components/SkinTypeSelector';
import { AcneSeveritySelector } from '../profile/components/AcneSeveritySelector';
import { AgeInput } from '../profile/components/AgeInput';
import { AllergyManager } from '../profile/components/AllergyManager';
import { SensitivityManager } from '../profile/components/SensitivityManager';

/**
 * OnboardingScreen — first-run baseline form (blueprint §4.2).
 * Locked composition: docs/design/screens/onboarding.md.
 * Writes straight into the profile store (the store is the draft);
 * only skin type is required. Completion is device-local; Supabase
 * sync is best-effort when signed in and never blocks entry.
 */
export const OnboardingScreen: React.FC = () => {
  const router = useRouter();
  const { colors, spacing } = theme;
  const [showValidation, setShowValidation] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    if (submitting) return;
    if (!useProfileStore.getState().user_skin_type) {
      setShowValidation(true);
      return;
    }
    setShowValidation(false);
    setSyncError('');
    setSubmitting(true);
    try {
      await useProfileStore.getState().setHasCompletedOnboarding(true);
      if (useProfileStore.getState().user_id) {
        try {
          await useProfileStore.getState().persistToSupabase();
        } catch {
          setSyncError("We couldn't save to your account. Your entries are kept on this device.");
        }
      }
    } finally {
      setSubmitting(false);
      router.replace('/');
    }
  };

  // Intentionally pressable while invalid so the validation notice can
  // fire; submission itself is gated on skin type inside handleSubmit.
  const ready = userSkinType !== null && !submitting;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text.primary }]}>Welcome to BeautiLyze</Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Set your baseline once. You can change everything later in Profile.
          </Text>
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
          <Text style={[styles.notice, { color: colors.verdict.caution }]}>{syncError}</Text>
        ) : null}

        <View style={styles.submitContainer}>
          <TouchableOpacity
            testID="onboarding-submit"
            onPress={handleSubmit}
            disabled={submitting}
            accessibilityLabel="Get started"
            accessibilityState={{ disabled: !ready }}
            style={[
              styles.submitButton,
              { backgroundColor: colors.brand.accent },
              !ready && styles.submitButtonDisabled,
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={colors.text.onAccent} />
            ) : (
              <Text style={styles.submitButtonText}>Get started</Text>
            )}
          </TouchableOpacity>
        </View>
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
  helper: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.size.sm,
    marginTop: theme.spacing.sm,
  },
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
  submitButton: {
    alignItems: 'center',
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: theme.colors.text.onAccent,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
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
