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
  onAccept: () => void;
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
            onPress={onAccept}
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
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.surface.rule,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  imageOverlayText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    color: theme.colors.text.onAccent,
    textAlign: 'center',
  },
  predictionCard: {
    backgroundColor: theme.colors.surface.raised,
    borderRadius: theme.radii.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.surface.rule,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface.rule,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 16,
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  labelContainer: {
    flex: 1,
  },
  predictionLabel: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  predictionValue: {
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
  },
  confidenceContainer: {
    alignItems: 'flex-end',
  },
  confidenceLabel: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  confidenceValue: {
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
  },
  confidenceBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  confidenceBarBackground: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.surface.rule,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidencePercent: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text.secondary,
    minWidth: 50,
    textAlign: 'right',
  },
  noticeText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    color: theme.colors.verdict.caution,
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: theme.colors.brand.accent,
  },
  actionButtonSecondary: {
    backgroundColor: theme.colors.surface.raised,
    borderWidth: 1,
    borderColor: theme.colors.surface.rule,
  },
  actionButtonText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold,
  },
  modelInfo: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface.base,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.surface.rule,
  },
  modelInfoText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm,
    color: theme.colors.text.tertiary,
    marginBottom: 2,
  },
  retakeButton: {
    marginTop: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface.raised,
    borderWidth: 1,
    borderColor: theme.colors.surface.rule,
    alignItems: 'center',
  },
  retakeButtonText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text.primary,
  },
});