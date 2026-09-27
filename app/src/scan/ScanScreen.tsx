/**
 * ScanScreen — Main scan workflow screen.
 * State machine: PERMISSIONS_REQUIRED → CAMERA_ACTIVE → ANALYZING → RESULT_REVIEW / ERROR_RETRY
 * Per blueprint §5.1, §5.3, §5.4.
 */

import React from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { useScan } from './hooks/useScan';
import { CameraViewport } from './components/CameraViewport';
import { AnalysisShimmer } from './components/AnalysisShimmer';
import { ScanResultView } from './components/ScanResultView';
import { theme } from '../theme';

export const ScanScreen: React.FC = () => {
  const router = useRouter();
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
            isCapturing={isAnalyzing}
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
              router.push('/profile');
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
                onPress={capturedUri ? retryAnalysis : pickFromGallery}
                accessibilityLabel={capturedUri ? 'Retry analysis' : 'Choose photo again'}
              >
                <Text style={styles.primaryButtonText}>{capturedUri ? 'Retry' : 'Choose photo again'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={retakePhoto}
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
      <TouchableOpacity onPress={() => router.push('/profile')} accessibilityLabel="Set profile manually">
        <Text style={styles.secondaryButtonText}>Set profile manually</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface.base,
    flex: 1,
  },
  errorActions: {
    gap: theme.spacing.md,
    width: '100%',
  },
  errorContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  errorMessage: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  errorTitle: {
    color: theme.colors.verdict.mismatch,
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.semibold,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  header: {
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  headerSubtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
  },
  headerTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.semibold,
    marginBottom: theme.spacing.xs,
  },
  permissionContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  permissionText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.size.md,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  permissionTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.semibold,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.brand.accent,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    width: '100%',
  },
  primaryButtonText: {
    color: theme.colors.text.onAccent,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.raised,
    borderColor: theme.colors.surface.rule,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    paddingVertical: theme.spacing.md,
    width: '100%',
  },
  secondaryButtonText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.medium,
  },
});
