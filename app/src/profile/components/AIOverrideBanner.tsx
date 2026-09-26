import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SkinType, AcneSeverity } from '../../verdict/types';
import { theme } from '../../theme';

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
  const { colors, spacing, radii } = theme;

  if (aiValue === null) return null;

  const isHighConfidence = confidence !== null && confidence >= 0.60;
  const label = field === 'skin_type' ? 'Skin Type' : 'Acne Severity';
  const confidencePercent = confidence !== null ? confidence.toFixed(2) : null;

  return (
    <View style={[styles.banner, { backgroundColor: colors.surface.raised }]}>
      <View style={styles.header}>
        <View style={styles.iconWrapper}>
          <Text style={styles.icon}></Text>
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            AI Estimate: {label}
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            {confidencePercent !== null
              ? `Model score: ${confidencePercent}`
              : 'Confidence unavailable'}
            {modelVersion && ` • ${modelVersion}`}
          </Text>
        </View>
      </View>

      <View style={styles.valueRow}>
        <View style={styles.valueBox}>
          <Text style={[styles.valueLabel, { color: colors.text.secondary }]}>
            AI Estimate
          </Text>
          <Text style={[styles.value, { color: colors.text.primary }]}>
            {aiValue.charAt(0).toUpperCase() + aiValue.slice(1)}
          </Text>
        </View>

        <View style={styles.valueBox}>
          <Text style={[styles.valueLabel, { color: colors.text.secondary }]}>
            Your Setting
          </Text>
          <Text style={[styles.value, { color: colors.text.primary }]}>
            {userValue
              ? userValue.charAt(0).toUpperCase() + userValue.slice(1)
              : 'Not set'}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {(
          <TouchableOpacity
            onPress={onAccept}
            style={[
              styles.button,
              styles.buttonPrimary,
              { backgroundColor: colors.brand.accent },
            ]}
            accessibilityLabel={`Accept AI estimate for ${label}`}
          >
            <Text style={styles.buttonText}>{isHighConfidence ? 'Looks right' : 'Accept'}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={onChange}
          style={[
            styles.button,
            styles.buttonSecondary,
            { borderColor: colors.brand.accent },
          ]}
          accessibilityLabel={`Change ${label} setting`}
        >
          <Text style={[
            styles.buttonText,
            styles.buttonTextSecondary,
            { color: colors.brand.accent },
          ]}>
            Change
          </Text>
        </TouchableOpacity>
      </View>

      {!isHighConfidence && (
        <View style={styles.lowConfidenceNotice}>
          <Text style={[styles.noticeText, { color: colors.verdict.caution }]}>
            The model was uncertain about this scan. Please review and set manually.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  banner: {
    borderRadius: theme.radii.md,
    borderWidth: 1,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  button: {
    alignItems: 'center',
    borderRadius: theme.radii.md,
    borderWidth: 1,
    flex: 1,
    paddingVertical: theme.spacing.lg,
  },
  buttonPrimary: {
    borderWidth: 0,
  },
  buttonSecondary: {
    backgroundColor: theme.colors.surface.raised,
  },
  buttonText: {
    color: theme.colors.surface.raised,
    fontSize: theme.typography.size.md,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: theme.colors.brand.accent,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  headerText: {
    flex: 1,
  },
  icon: {
    fontSize: theme.typography.size.xxl,
  },
  iconWrapper: {
    marginRight: theme.spacing.md,
  },
  lowConfidenceNotice: {
    backgroundColor: theme.colors.surface.base,
    borderRadius: theme.radii.md,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
  },
  noticeText: {
    fontSize: theme.typography.size.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.size.sm,
    marginTop: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.size.md,
    fontWeight: '600',
  },
  value: {
    fontSize: theme.typography.size.md,
    fontWeight: '600',
  },
  valueBox: {
    backgroundColor: theme.colors.surface.base,
    borderRadius: theme.radii.md,
    flex: 1,
    padding: theme.spacing.md,
  },
  valueLabel: {
    fontSize: theme.typography.size.xs,
    marginBottom: theme.spacing.xs,
  },
  valueRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
});
