/**
 * Camera viewport with framing overlay.
 * Per blueprint §5.1: Live viewport with framing overlay and capture button.
 * Secondary button for gallery pick.
 */

import React, { useRef, useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Text } from '../../components/ui/Text';
import { Camera, CameraView, CameraType } from 'expo-camera';
import { theme } from '../../theme';
import { Icon } from '../../components/ui/Icon';

interface CameraViewportProps {
  onAnalyze: (uri: string) => void;
  onGalleryPick: () => void;
  onPermissionGranted: () => void;
  permissionStatus: 'undetermined' | 'granted' | 'denied';
  isCapturing: boolean;
}

export const CameraViewport: React.FC<CameraViewportProps> = ({
  onAnalyze,
  onGalleryPick,
  onPermissionGranted,
  permissionStatus,
  isCapturing,
}) => {
  const cameraRef = useRef<CameraView>(null);
  const [captureError, setCaptureError] = useState('');
  const [hasPermission, setHasPermission] = React.useState(false);
  const [cameraType, setCameraType] = useState<CameraType>('front');

  useEffect(() => {
    if (permissionStatus === 'granted') {
      setHasPermission(true);
      onPermissionGranted();
    } else {
      setHasPermission(false);
    }
  }, [permissionStatus, onPermissionGranted]);

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      if (Platform.OS !== 'web') {
        setCaptureError('Native capture is unavailable in this build. Set your profile manually.');
        return;
      }
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
      });
      onAnalyze(photo.uri);
    } catch {
      setCaptureError('The camera could not capture a photo. Please try again.');
    }
  };

  const toggleCamera = () => {
    setCameraType((prev) => (prev === 'front' ? 'back' : 'front'));
  };

  if (permissionStatus === 'denied') {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>
          BeautiLyze needs camera access to scan your skin for personalized product recommendations.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => Camera.requestCameraPermissionsAsync()}
        >
          <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.permissionGalleryButton}
          onPress={onGalleryPick}
        >
          <Text style={styles.permissionGalleryButtonText}>Choose from Gallery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.text.primary} />
        <Text style={styles.loadingText}>Requesting camera access...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {captureError ? <Text accessibilityRole="alert">{captureError}</Text> : null}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
      >
        <View style={styles.overlay}>
          {/* Framing reticle */}
          <View style={styles.reticle} />
          <Text style={styles.reticleText}>Position your face here</Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, styles.flipButton]}
            onPress={toggleCamera}
            disabled={isCapturing}
            accessibilityLabel="Flip camera"
          >
            <Icon name="switch-camera" />
          </TouchableOpacity>

          <TouchableOpacity
            testID="capture-button"
            style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
            onPress={handleCapture}
            disabled={isCapturing}
            activeOpacity={0.8}
            accessibilityLabel="Take photo"
          >
            <View style={[
              styles.captureRing,
              isCapturing && styles.captureRingCapturing
            ]}>
              {!isCapturing && <View style={styles.captureInner} />}
              {isCapturing && <ActivityIndicator size="small" color={theme.colors.text.onAccent} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.galleryButton]}
            onPress={onGalleryPick}
            disabled={isCapturing}
            accessibilityLabel="Choose from gallery"
          >
            <Icon name="images" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
  captureButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.brand.accent,
    borderRadius: 36,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureInner: {
    backgroundColor: theme.colors.brand.accent,
    borderRadius: 24,
    height: 48,
    width: 48,
  },
  captureRing: {
    alignItems: 'center',
    borderColor: theme.colors.text.onAccent,
    borderRadius: 32,
    borderWidth: 3,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  captureRingCapturing: {
    borderColor: theme.colors.text.onAccent,
  },
  container: {
    backgroundColor: theme.colors.surface.base,
    flex: 1,
  },
  controlButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.raised,
    borderRadius: 28,
    elevation: 3,
    height: 56,
    justifyContent: 'center',
    shadowColor: theme.colors.brand.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: 56,
  },
  controls: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  flipButton: {
    backgroundColor: theme.colors.surface.raised,
  },
  galleryButton: {
    backgroundColor: theme.colors.surface.raised,
  },
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.base,
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    marginTop: theme.spacing.md,
  },
  overlay: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  permissionButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.brand.accent,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    width: '100%',
  },
  permissionButtonText: {
    color: theme.colors.text.onAccent,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
  },
  permissionContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.base,
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  permissionGalleryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.raised,
    borderColor: theme.colors.surface.rule,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    paddingVertical: theme.spacing.md,
    width: '100%',
  },
  permissionGalleryButtonText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.medium,
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
  reticle: {
    backgroundColor: theme.colors.surface.transparent,
    borderColor: theme.colors.brand.accent,
    borderRadius: 140,
    borderWidth: 2,
    height: 280,
    width: 280,
  },
  reticleText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    marginTop: 16,
    textAlign: 'center',
  },
});
