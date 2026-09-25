import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SkinType, AcneSeverity } from '../../verdict/types';
import { useTheme } from '../../theme';

interface AIOverrideBannerProps {
  field: 'skin_type' | 'acne_severity';
  aiValue: SkinType | AcneSeverity | null;
  confidence: number | null;
  userValue: SkinType | AcneSeverity | null;
  onAccept: () => void;
  onChange: () => void;
  modelVersion?: string | null;
}

export const AIOverrideBanner: React.FC<AIOverrideBannerProps> = ({
  field,
  aiValue,
  confidence,
  userValue,
  onAccept,
  onChange,
  modelVersion,
}) => {
  const { colors, spacing, radii } = useTheme();

  if (aiValue === null) return null;

  const isHighConfidence = confidence !== null && confidence >= 0.60;
  const label = field === 'skin_type' ? 'Skin Type' : 'Acne Severity';
  const confidencePercent = confidence !== null ? Math.round(confidence * 100) : null;

  return (
    <View style={[styles.banner, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <View style={styles.iconWrapper}>
          <Text style={styles.icon}>🤖</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>
            AI Estimate: {label}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {confidencePercent !== null
              ? `Model score: ${confidencePercent}%`
              : 'Confidence unavailable'}
            {modelVersion && ` • ${modelVersion}`}
          </Text>
        </View>
      </View>

      <View style={styles.valueRow}>
        <View style={styles.valueBox}>
          <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>
            AI Estimate
          </Text>
          <Text style={[styles.value, { color: colors.text }]}>
            {aiValue.charAt(0).toUpperCase() + aiValue.slice(1)}
          </Text>
        </View>

        <View style={styles.valueBox}>
          <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>
            Your Setting
          </Text>
          <Text style={[styles.value, { color: colors.text }]}>
            {userValue
              ? userValue.charAt(0).toUpperCase() + userValue.slice(1)
              : 'Not set'}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {isHighConfidence && (
          <TouchableOpacity
            onPress={onAccept}
            style={[
              styles.button,
              styles.buttonPrimary,
              { backgroundColor: colors.primary },
            ]}
            accessibilityLabel={`Accept AI estimate for ${label}`}
          >
            <Text style={styles.buttonText}>Looks right</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={onChange}
          style={[
            styles.button,
            styles.buttonSecondary,
            { borderColor: colors.primary },
          ]}
          accessibilityLabel={`Change ${label} setting`}
        >
          <Text style={[
            styles.buttonText,
            styles.buttonTextSecondary,
            { color: colors.primary },
          ]}>
            Change
          </Text>
        </TouchableOpacity>
      </View>

      {!isHighConfidence && (
        <View style={styles.lowConfidenceNotice}>
          <Text style={[styles.noticeText, { color: colors.warning }]}>
            ⚠️ The model was uncertain about this scan. Please review and set manually.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconWrapper: {
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  valueRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  valueBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  valueLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  buttonPrimary: {
    borderColor: 'transparent',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonTextSecondary: {
    color: '#007AFF',
  },
  lowConfidenceNotice: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FFF8E1',
  },
  noticeText: {
    fontSize: 13,
    textAlign: 'center',
  },
});