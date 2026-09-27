/**
 * Scan workflow hook.
 * Manages state machine: PERMISSIONS_REQUIRED → CAMERA_ACTIVE → ANALYZING → RESULT_REVIEW / ERROR_RETRY
 * Per blueprint §5.1, §5.3, §5.4.
 * Hydrates profile store via setAIProfile on acceptance.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useProfileStore } from '../../profile/store';
import type { SkinType, AcneSeverity } from '../../verdict/types';
import { predictBoth } from '../api';
import { pickAndAnalyzeNative } from '../nativeUpload';
import {
  ScanState,
  CameraPermissionStatus,
  ScanResult,
  PredictResponse,
  ConfidenceEvaluation,
  InferenceError,
  UseScanReturn,
} from '../types';

export function useScan(): UseScanReturn {
  const generation = useRef(0);
  const picking = useRef(false);
  useEffect(() => () => { generation.current++; }, []);
  const [state, setState] = useState<ScanState>('PERMISSIONS_REQUIRED');
  const [cameraPermission, setCameraPermission] = useState<CameraPermissionStatus>('undetermined');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<InferenceError | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [skinTypeEvaluation, setSkinTypeEvaluation] = useState<ConfidenceEvaluation | null>(null);
  const [acneSeverityEvaluation, setAcneSeverityEvaluation] = useState<ConfidenceEvaluation | null>(null);

  const setAIProfile = useProfileStore((s) => s.setAIProfile);

  // Check camera permission on mount
  useEffect(() => {
    (async () => {
      const { status } = await Camera.getCameraPermissionsAsync();
      setCameraPermission(status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined');
      if (generation.current !== 0) return;
      if (status === 'granted') {
        setState('CAMERA_ACTIVE');
      } else {
        setState('PERMISSIONS_REQUIRED');
      }
    })();
  }, []);

  const requestCameraPermission = useCallback(async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    const newPermission = status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
    setCameraPermission(newPermission);
    if (status === 'granted') {
      setState('CAMERA_ACTIVE');
    }
  }, []);

  const takePhoto = useCallback(async () => {
    // This will be called from CameraViewport with the captured URI
    // The actual capture is handled by CameraViewport component
  }, []);

  const pickFromGallery = useCallback(async () => {
    if (Platform.OS !== 'web') {
      if (picking.current) return;
      picking.current = true;
      const request = ++generation.current;
      setCapturedUri(null);
      setScanResult(null);
      setError(null);
      setIsAnalyzing(true);
      setState('ANALYZING');
      try {
        const result = await pickAndAnalyzeNative();
        if (request !== generation.current) return;
        if (!result) {
          setState(cameraPermission === 'granted' ? 'CAMERA_ACTIVE' : 'PERMISSIONS_REQUIRED');
          return;
        }
        setScanResult(result);
        setSkinTypeEvaluation(evaluateConfidence('skinType', result.skinType));
        setAcneSeverityEvaluation(evaluateConfidence('acneSeverity', result.acneSeverity));
        setState('RESULT_REVIEW');
      } catch (cause) {
        if (request === generation.current) {
          setError({ message: cause instanceof Error ? cause.message : 'Photo upload failed. Please choose a photo again.' });
          setState('ERROR_RETRY');
        }
      } finally {
        picking.current = false;
        if (request === generation.current) setIsAnalyzing(false);
      }
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setCapturedUri(uri);
      setState('ANALYZING');
      await analyzePhoto(uri);
    }
  }, [cameraPermission]);

  const analyzePhoto = useCallback(async (uri?: string) => {
    const imageUri = uri || capturedUri;
    if (!imageUri) return;
    const request = ++generation.current;
    setCapturedUri(imageUri);
    setState('ANALYZING');
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await predictBoth(imageUri);
      if (request !== generation.current) return;
      setScanResult(result);

      // Evaluate confidence for each field
      const skinTypeEval = evaluateConfidence('skinType', result.skinType);
      const acneSeverityEval = evaluateConfidence('acneSeverity', result.acneSeverity);

      setSkinTypeEvaluation(skinTypeEval);
      setAcneSeverityEvaluation(acneSeverityEval);

      setState('RESULT_REVIEW');
    } catch (err) {
      if (request !== generation.current) return;
      const error: InferenceError = {
        message: err instanceof Error ? err.message : 'Analysis failed',
        code: 'INFERENCE_ERROR',
      };
      setError(error);
      setState('ERROR_RETRY');
    } finally {
      if (request === generation.current) setIsAnalyzing(false);
    }
  }, [capturedUri]);

  const acceptAIInputs = useCallback((field: 'skinType' | 'acneSeverity') => {
    if (!scanResult) return;

    // Hydrate profile store with AI predictions
    setAIProfile({
      ai_skin_type: scanResult.skinType.label as SkinType,
      ai_acne_severity: scanResult.acneSeverity.label as AcneSeverity,
      skin_type_confidence: scanResult.skinType.confidence,
      acne_severity_confidence: scanResult.acneSeverity.confidence,
      model_version: scanResult.skinType.model_version, // both use same model version
    });
    if (field === 'skinType') useProfileStore.getState().acceptAISkinType();
    else useProfileStore.getState().acceptAIAcneSeverity();
    // Optionally navigate to verdict screen or stay on result review
    // For now, stay on result review to show acceptance
  }, [scanResult, setAIProfile]);

  const retakePhoto = useCallback(() => {
    generation.current++;
    setIsAnalyzing(false);
    setCapturedUri(null);
    setScanResult(null);
    setSkinTypeEvaluation(null);
    setAcneSeverityEvaluation(null);
    setError(null);
    setState('CAMERA_ACTIVE');
  }, []);

  const retryAnalysis = useCallback(async () => {
    if (capturedUri) {
      await analyzePhoto(capturedUri);
    }
  }, [capturedUri, analyzePhoto]);

  const dismissError = useCallback(() => {
    setError(null);
    if (capturedUri) {
      setState('ANALYZING');
      analyzePhoto(capturedUri);
    } else {
      setState('CAMERA_ACTIVE');
    }
  }, [capturedUri, analyzePhoto]);

  return {
    // State
    state,
    cameraPermission,
    capturedUri,
    scanResult,
    error,
    isAnalyzing,
    skinTypeEvaluation,
    acneSeverityEvaluation,

    // Actions
    requestCameraPermission,
    takePhoto,
    pickFromGallery,
    analyzePhoto,
    acceptAIInputs,
    retakePhoto,
    retryAnalysis,
    dismissError,
  };
}

/**
 * Evaluate confidence for a prediction.
 * Per blueprint §5.4: threshold 0.60
 */
function evaluateConfidence(
  field: 'skinType' | 'acneSeverity',
  prediction: PredictResponse
): ConfidenceEvaluation {
  const isHighConfidence = prediction.confidence >= 0.60;
  return {
    field,
    confidence: prediction.confidence,
    isHighConfidence,
    actionLabel: isHighConfidence ? 'Looks right' : 'Accept',
    noticeText: !isHighConfidence ? 'The model was uncertain about this scan' : undefined,
  };
}
