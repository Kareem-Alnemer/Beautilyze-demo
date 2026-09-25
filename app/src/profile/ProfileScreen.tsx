import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { theme } from '../theme';
import { useProfileStore, selectUserSkinType, selectUserAcneSeverity, selectAIProfile, isAIHighConfidence } from './store';
import { SkinTypeSelector } from './components/SkinTypeSelector';
import { AcneSeveritySelector } from './components/AcneSeveritySelector';
import { AgeInput } from './components/AgeInput';
import { AllergyManager } from './components/AllergyManager';
import { SensitivityManager } from './components/SensitivityManager';
import { AIOverrideBanner } from './components/AIOverrideBanner';
import { SkinType, AcneSeverity } from '../verdict/types';

export const ProfileScreen: React.FC = () => {
  const { colors, spacing } = theme;

  // Selectors
  const userSkinType = useProfileStore(selectUserSkinType);
  const userAcneSeverity = useProfileStore(selectUserAcneSeverity);
  const age = useProfileStore((s) => s.age);
  const allergies = useProfileStore((s) => s.allergies);
  const sensitivities = useProfileStore((s) => s.sensitivities);
  const aiProfile = useProfileStore(selectAIProfile);
  const isSkinTypeHighConfidence = isAIHighConfidence(useProfileStore.getState(), 'skin_type');
  const isAcneSeverityHighConfidence = isAIHighConfidence(useProfileStore.getState(), 'acne_severity');

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
    try {
      await persistToSupabase();
      Alert.alert('Saved', 'Your profile has been saved.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Profile',
      'This will clear all your profile data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => {
          // Reset would be implemented here
          Alert.alert('Reset', 'Profile reset functionality to be implemented.');
        }},
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text.primary }]}>Your Profile</Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Set your skin profile for personalized product checks
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
            onChange={() => {}}
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
            onChange={() => {}}
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
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Age</Text>
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

        {/* Save Button */}
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity
            onPress={handleSave}
            style={[
              styles.saveButton,
              { backgroundColor: colors.brand.accent },
            ]}
            accessibilityLabel="Save profile"
          >
            <Text style={styles.saveButtonText}>Save Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Reset Button */}
        <View style={styles.resetButtonContainer}>
          <TouchableOpacity
            onPress={handleReset}
            style={styles.resetButton}
          >
            <Text style={[styles.resetButtonText, { color: colors.text.secondary }]}>
              Reset Profile
            </Text>
          </TouchableOpacity>
        </View>
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
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.xxl,
    fontWeight: theme.typography.weight.semibold,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.size.md,
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
  saveButtonContainer: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  saveButton: {
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.onAccent,
  },
  resetButtonContainer: {
    marginBottom: theme.spacing.lg,
  },
  resetButton: {
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  resetButtonText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.medium,
  },
});