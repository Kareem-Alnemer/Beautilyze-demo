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
import { SkinType, AcneSeverity } from '../../verdict/types';

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
          <Text style={[styles.title, { color: colors.text }]}>Your Profile</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Age</Text>
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
              { backgroundColor: colors.primary },
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
            <Text style={[styles.resetButtonText, { color: colors.textSecondary }]}>
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
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  saveButtonContainer: {
    marginTop: 24,
    marginBottom: 12,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  resetButtonContainer: {
    marginBottom: 16,
  },
  resetButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});