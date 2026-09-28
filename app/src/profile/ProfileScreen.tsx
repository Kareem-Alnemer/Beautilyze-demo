import React, { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { supabase } from '../lib/supabase';
import { View, ScrollView, StyleSheet, SafeAreaView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from '../components/ui/Text';
import { theme } from '../theme';
import { useProfileStore, selectUserSkinType, selectUserAcneSeverity, selectAIProfile } from './store';
import { SkinTypeSelector } from './components/SkinTypeSelector';
import { AcneSeveritySelector } from './components/AcneSeveritySelector';
import { AgeInput } from './components/AgeInput';
import { AllergyManager } from './components/AllergyManager';
import { SensitivityManager } from './components/SensitivityManager';
import { AIOverrideBanner } from './components/AIOverrideBanner';
import { Button } from '../components/ui/Button';

export const ProfileScreen: React.FC = () => {
  const { colors } = theme;
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');
  const userId = useProfileStore((s) => s.user_id);
  const synced = useProfileStore((s) => s.is_synced);

  // Selectors
  const userSkinType = useProfileStore(selectUserSkinType);
  const userAcneSeverity = useProfileStore(selectUserAcneSeverity);
  const age = useProfileStore((s) => s.age);
  const allergies = useProfileStore((s) => s.allergies);
  const sensitivities = useProfileStore((s) => s.sensitivities);
  const aiProfile = useProfileStore(useShallow(selectAIProfile));

  // Actions
  const setUserSkinType = useProfileStore((s) => s.setUserSkinType);
  const setUserAcneSeverity = useProfileStore((s) => s.setUserAcneSeverity);
  const setAge = useProfileStore((s) => s.setAge);
  const addAllergy = useProfileStore((s) => s.addAllergy);
  const removeAllergy = useProfileStore((s) => s.removeAllergy);
  const addSensitivity = useProfileStore((s) => s.addSensitivity);
  const removeSensitivity = useProfileStore((s) => s.removeSensitivity);
  const acceptAISkinType = useProfileStore((s) => s.acceptAISkinType);
  const acceptAIAcneSeverity = useProfileStore((s) => s.acceptAIAcneSeverity);
  const persistToSupabase = useProfileStore((s) => s.persistToSupabase);

  const handleSave = async () => {
    if (saving || !userId) return;
    setSaving(true);
    setError('');
    try {
      await persistToSupabase();

    } catch {
      setError('Could not save your profile. Your changes are still available here.');
    } finally { setSaving(false); }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    setError('');
    try {
      const { error: cause } = await supabase.auth.signOut();
      if (cause) throw cause;
    } catch { setError('Could not sign out. Please try again.'); }
    finally { setSigningOut(false); }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Profile',
      'Clear the fields in this draft? Your account changes only after you save.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => {
          setError('');
          useProfileStore.getState().resetProfile();
        }},
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text.primary }]}>Your Profile</Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            {userId ? 'Account profile' : 'Guest profile'}
          </Text>
        </View>

        {/* Skin Type Section */}
        <View style={styles.section}>
          <AIOverrideBanner
            field="skin_type"
            aiValue={aiProfile.ai_skin_type}
            confidence={aiProfile.skin_type_confidence}
            userValue={userSkinType}
            onAccept={acceptAISkinType}
            onChange={() => setUserSkinType(null)}
            modelVersion={aiProfile.model_version}
          />
          <SkinTypeSelector
            value={userSkinType}
            onChange={setUserSkinType}
            label="Skin Type"
          />
        </View>

        {/* Acne Severity Section */}
        <View style={styles.section}>
          <AIOverrideBanner
            field="acne_severity"
            aiValue={aiProfile.ai_acne_severity}
            confidence={aiProfile.acne_severity_confidence}
            userValue={userAcneSeverity}
            onAccept={acceptAIAcneSeverity}
            onChange={() => setUserAcneSeverity(null)}
            modelVersion={aiProfile.model_version}
          />
          <AcneSeveritySelector
            value={userAcneSeverity}
            onChange={setUserAcneSeverity}
            label="Acne Severity"
          />
        </View>

        {/* Age Section */}
        <View style={styles.section}>
          <AgeInput
            value={age}
            onChange={setAge}
            label="Age"
            min={13}
            max={100}
          />
        </View>

        {/* Allergies Section */}
        <View style={styles.section}>
          <AllergyManager
            items={allergies}
            onAdd={addAllergy}
            onRemove={removeAllergy}
          />
        </View>

        {/* Sensitivities Section */}
        <View style={styles.section}>
          <SensitivityManager
            items={sensitivities}
            onAdd={addSensitivity}
            onRemove={removeSensitivity}
          />
        </View>

        <View style={styles.saveButtonContainer}>
          <Text accessibilityLiveRegion="polite" style={styles.status}>
            {!userId ? 'Not saved to an account. This draft lasts for this app session.' :
              saving ? 'Saving your changes...' : synced ? 'All changes saved.' : 'Unsaved changes'}
          </Text>
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          {userId && <Button title={saving ? 'Saving...' : 'Save Profile'} accessibilityLabel="Save profile"
            busy={saving} disabled={signingOut || synced} onPress={() => { void handleSave(); }} />}
          <Button title="Reset Profile" variant="text" disabled={saving || signingOut} onPress={handleReset} />
          {userId && <Button title={signingOut ? 'Signing out...' : 'Sign out'} variant="text"
            busy={signingOut} disabled={saving} onPress={() => { void handleSignOut(); }} />}
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
  error: {
    color: theme.colors.verdict.mismatch, fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md, marginBottom: theme.spacing.sm,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  keyboard: { flex: 1 },
  saveButtonContainer: {
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  status: {
    color: theme.colors.text.secondary, fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md, marginBottom: theme.spacing.md,
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
