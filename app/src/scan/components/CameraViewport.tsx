/**
 * Camera viewport with framing overlay.
 * Per blueprint §5.1: Live viewport with framing overlay and capture button.
 * Secondary button for gallery pick.
 */

import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { theme } from '../../theme';

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
  const cameraRef = useRef<Camera>(null);
  const [hasPermission, setHasPermission] = React.useState(false);
  const [cameraType, setCameraType] = useState<CameraType>(CameraType.front);

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
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
      });
      onAnalyze(photo.uri);
    } catch (error) {
      console.error('Capture failed:', error);
    }
  };

  const toggleCamera = () => {
    setCameraType((prev) => (prev === CameraType.front ? CameraType.back : CameraType.front));
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
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={cameraType}
        ratio="1:1"
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
            <Text style={styles.controlButtonText}>\u21C5</Text>
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
            <Text style={styles.controlButtonText}>\u25B6</Text>
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface.base,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reticle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 2,
    borderColor: theme.colors.brand.accent,
    backgroundColor: 'transparent',
  },
  reticleText: {
    marginTop: 16,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.surface.raised,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.brand.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  flipButton: {
    backgroundColor: theme.colors.surface.raised,
  },
  galleryButton: {
    backgroundColor: theme.colors.surface.raised,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.brand.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: theme.colors.text.onAccent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureRingCapturing: {
    borderColor: theme.colors.text.onAccent,
  },
  captureInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.brand.accent,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface.base,
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
  permissionButton: {
    width: '100%',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.brand.accent,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  permissionButtonText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    color: theme.colors.text.onAccent,
  },
  permissionGalleryButton: {
    width: '100%',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface.raised,
    borderWidth: 1,
    borderColor: theme.colors.surface.rule,
    alignItems: 'center',
  },
  permissionGalleryButtonText: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.medium,
    color: theme.colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.base,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
    color: theme.colors.text.secondary,
  },
});