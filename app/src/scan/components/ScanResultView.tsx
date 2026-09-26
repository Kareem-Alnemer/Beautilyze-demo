/**
 * Scan result review view.
 * Per blueprint §5.4: Shows AI predictions, confidence indicators,
 * and primary actions ("Looks right"/"Accept" or "Retake"/"Set manually").
 * Terminology per §10.2: Never "safe", "treatment", "73% confident".
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { theme } from '../../theme';
import { ScanResult, ConfidenceEvaluation } from '../types';

interface ScanResultViewProps {
  result: {
    skinType: { label: string; confidence: number; model_version: string };
    acneSeverity: { label: string; confidence: number; model_version: string };
    capturedUri: string;
  };
  skinTypeEval: {
    confidence: number;
    isHighConfidence: boolean;
    actionLabel: 'Looks right' | 'Accept';
    noticeText?: string;
  };
  acneSeverityEval: {
    confidence: number;
    isHighConfidence: boolean;
    actionLabel: 'Looks right' | 'Accept';
    noticeText?: string;
  };
  onAccept: (field: 'skinType' | 'acneSeverity') => void;
  onRetake: () => void;
  onSetManually: () => void;
}

export const ScanResultView: React.FC<ScanResultViewProps> = ({
  result,
  skinTypeEval,
  acneSeverityEval,
  onAccept,
  onRetake,
  onSetManually,
}) => {
  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.60) return theme.colors.verdict.match;
    if (confidence >= 0.40) return theme.colors.verdict.caution;
    return theme.colors.verdict.mismatch;
  };

  const renderPredictionCard = (
    title: string,
    label: string,
    confidence: number,
    evaluation: { isHighConfidence: boolean; actionLabel: 'Looks right' | 'Accept'; noticeText?: string },
    iconName: string
  ) => {
    const color = getConfidenceColor(confidence);
    const confidencePercent = formatConfidence(confidence);

    return (
      <View style={styles.predictionCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{title}</Text>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{iconName}</Text>
          </View>
        </View>

        <View style={styles.predictionRow}>
          <View style={styles.labelContainer}>
            <Text style={styles.predictionLabel}>AI estimates</Text>
            <Text style={[styles.predictionValue, { color: getConfidenceColor(confidence) }]}>
              {label}
            </Text>
          </View>
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceLabel}>Model score</Text>
            <Text style={[styles.confidenceValue, { color: getConfidenceColor(confidence) }]}>
              {confidence.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.confidenceBarContainer}>
          <View style={styles.confidenceBarBackground}>
            <View
              style={[
                styles.confidenceBarFill,
                { width: `${confidence * 100}%`, backgroundColor: getConfidenceColor(confidence) },
              ]}
            />
          </View>
          <Text style={styles.confidencePercent}>{formatConfidence(confidence)}</Text>
        </View>

        {evaluation.noticeText && (
          <Text style={styles.noticeText}>{evaluation.noticeText}</Text>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              evaluation.isHighConfidence ? styles.actionButtonPrimary : styles.actionButtonSecondary,
            ]}
            onPress={() => onAccept(title === 'Skin Type' ? 'skinType' : 'acneSeverity')}
            accessibilityLabel={`${evaluation.actionLabel} for ${title.toLowerCase()}`}
          >
            <Text style={styles.actionButtonText}>{evaluation.actionLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButtonSecondary}
            onPress={onSetManually}
            accessibilityLabel={`Set ${title.toLowerCase()} manually`}
          >
            <Text style={styles.actionButtonText}>Set manually</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Captured image preview */}
      <View style={styles.imagePreview}>
        <Image
          source={{ uri: result.capturedUri }}
          style={styles.previewImage}
          resizeMode="cover"
        />
        <View style={styles.imageOverlay}>
          <Text style={styles.imageOverlayText}>Your scan</Text>
        </View>
      </View>

      {/* Skin Type Prediction */}
      {renderPredictionCard(
        'Skin Type',
        result.skinType.label,
        result.skinType.confidence,
        skinTypeEval,
        '👤'
      )}

      {/* Acne Severity Prediction */}
      {renderPredictionCard(
        'Acne Severity',
        result.acneSeverity.label,
        result.acneSeverity.confidence,
        acneSeverityEval,
        '🔍'
      )}

      {/* Model info */}
      <View style={styles.modelInfo}>
        <Text style={styles.modelInfoText}>
          Model: {result.skinType.model_version}
        </Text>
        <Text style={styles.modelInfoText}>
          Both predictions use the same model version.
        </Text>
      </View>

      {/* Retake button */}
      <TouchableOpacity style={styles.retakeButton} onPress={onRetake} accessibilityLabel="Retake photo">
        <Text style={styles.retakeButtonText}>Retake Photo</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: theme.radii.md,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
  },
  actionButtonPrimary: {
    backgroundColor: theme.colors.brand.accent,
  },
  actionButtonSecondary: {
    backgroundColor: theme.colors.surface.raised,
    borderColor: theme.colors.surface.rule,
    borderWidth: 1,
  },
  actionButtonText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
  },
  confidenceBarBackground: {
    backgroundColor: theme.colors.surface.rule,
    borderRadius: 4,
    flex: 1,
    height: 8,
    overflow: 'hidden',
  },
  confidenceBarContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  confidenceBarFill: {
    borderRadius: 4,
    height: '100%',
  },
  confidenceContainer: {
    alignItems: 'flex-end',
  },
  confidenceLabel: {
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: 0.5,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  confidencePercent: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
    minWidth: 50,
    textAlign: 'right',
  },
  confidenceValue: {
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
  },
  icon: {
    fontSize: 16,
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.rule,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  imageOverlay: {
    backgroundColor: theme.colors.surface.scrim,
    bottom: 0,
    left: 0,
    padding: theme.spacing.md,
    position: 'absolute',
    right: 0,
  },
  imageOverlayText: {
    color: theme.colors.text.onAccent,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    textAlign: 'center',
  },
  imagePreview: {
    backgroundColor: theme.colors.surface.rule,
    borderRadius: theme.radii.md,
    height: 200,
    marginBottom: theme.spacing.xl,
    overflow: 'hidden',
    width: '100%',
  },
  labelContainer: {
    flex: 1,
  },
  modelInfo: {
    backgroundColor: theme.colors.surface.base,
    borderColor: theme.colors.surface.rule,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    marginTop: theme.spacing.xl,
    padding: theme.spacing.md,
  },
  modelInfoText: {
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    marginBottom: 2,
  },
  noticeText: {
    color: theme.colors.verdict.caution,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    fontStyle: 'italic',
    marginTop: theme.spacing.sm,
  },
  predictionCard: {
    backgroundColor: theme.colors.surface.raised,
    borderColor: theme.colors.surface.rule,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  predictionLabel: {
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: 0.5,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  predictionValue: {
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
  },
  previewImage: {
    height: '100%',
    width: '100%',
  },
  retakeButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.raised,
    borderColor: theme.colors.surface.rule,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    marginTop: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  retakeButtonText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.medium,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
});
