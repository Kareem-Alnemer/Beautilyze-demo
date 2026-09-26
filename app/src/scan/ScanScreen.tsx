/**
 * ScanScreen — Main scan workflow screen.
 * State machine: PERMISSIONS_REQUIRED → CAMERA_ACTIVE → ANALYZING → RESULT_REVIEW / ERROR_RETRY
 * Per blueprint §5.1, §5.3, §5.4.
 */

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { useScan } from './hooks/useScan';
import { CameraViewport } from './components/CameraViewport';
import { AnalysisShimmer } from './components/AnalysisShimmer';
import { ScanResultView } from './components/ScanResultView';
import { theme } from '../../theme';

export const ScanScreen: React.FC = () => {
  const {
    state,
    cameraPermission,
    capturedUri,
    scanResult,
    error,
    isAnalyzing,
    skinTypeEvaluation,
    acneSeverityEvaluation,
    requestCameraPermission,
    pickFromGallery,
    analyzePhoto,
    acceptAIInputs,
    retakePhoto,
    retryAnalysis,
    dismissError,
  } = useScan();

  // Set status bar style
  React.useEffect(() => {
    StatusBar.setBarStyle('dark-content', true);
    StatusBar.setBackgroundColor(theme.colors.surface.base, true);
  }, []);

  const renderContent = () => {
    switch (state) {
      case 'PERMISSIONS_REQUIRED':
        return (
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionTitle}>Camera Access Needed</Text>
            <Text style={styles.permissionText}>
              BeautiLyze uses your camera to analyze your skin and provide personalized product recommendations.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={requestCameraPermission}
              accessibilityLabel="Grant camera permission"
            >
              <Text style={styles.primaryButtonText}>Grant Camera Access</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={pickFromGallery}
              accessibilityLabel="Choose photo from gallery"
            >
              <Text style={styles.secondaryButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        );

      case 'CAMERA_ACTIVE':
        return (
          <CameraViewport
            onAnalyze={analyzePhoto}
            onGalleryPick={pickFromGallery}
            onPermissionGranted={() => {}}
            permissionStatus={cameraPermission}
            isCapturing={false}
          />
        );

      case 'ANALYZING':
        return <AnalysisShimmer message="Analyzing your skin..." />;

      case 'RESULT_REVIEW':
        if (!scanResult || !skinTypeEvaluation || !acneSeverityEvaluation) {
          return <AnalysisShimmer message="Preparing results..." />;
        }
        return (
          <ScanResultView
            result={{
              skinType: scanResult.skinType,
              acneSeverity: scanResult.acneSeverity,
              capturedUri: scanResult.capturedUri,
            }}
            skinTypeEval={skinTypeEvaluation}
            acneSeverityEval={acneSeverityEvaluation}
            onAccept={acceptAIInputs}
            onRetake={retakePhoto}
            onSetManually={() => {
              // Navigate to profile screen for manual entry
              // For now, just retake
              retakePhoto();
            }}
          />
        );

      case 'ERROR_RETRY':
        return (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Analysis Failed</Text>
            <Text style={styles.errorMessage}>
              {error?.message || 'Unable to analyze your photo. Please try again.'}
            </Text>
            <View style={styles.errorActions}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={retryAnalysis}
                accessibilityLabel="Retry analysis"
              >
                <Text style={styles.primaryButtonText}>Retry</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={dismissError}
                accessibilityLabel="Go back to camera"
              >
                <Text style={styles.secondaryButtonText}>Retake Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface.base} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan Your Skin</Text>
        <Text style={styles.headerSubtitle}>Get personalized product recommendations</Text>
      </View>
      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface.base,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    color: theme.colors.text.secondary,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  permissionTitle: {
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  permissionText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.size.md,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.brand.accent,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  primaryButtonText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.onAccent,
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface.raised,
    borderWidth: 1,
    borderColor: theme.colors.surface.rule,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  errorTitle: {
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.verdict.mismatch,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  errorMessage: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  errorActions: {
    width: '100%',
    gap: theme.spacing.md,
  },
});