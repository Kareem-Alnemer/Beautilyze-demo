/**
 * Scan workflow hook.
 * Manages state machine: PERMISSIONS_REQUIRED → CAMERA_ACTIVE → ANALYZING → RESULT_REVIEW / ERROR_RETRY
 * Per blueprint §5.1, §5.3, §5.4.
 * Hydrates profile store via setAIProfile on acceptance.
 */

import { useState, useCallback, useEffect } from 'react';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useProfileStore } from '../profile/store';
import { predictBoth } from '../api';
import {
  ScanState,
  CameraPermissionStatus,
  ScanResult,
  PredictResponse,
  ConfidenceEvaluation,
  InferenceError,
  UseScanReturn,
} from '../types';

const CONFIDENCE_THRESHOLD = 0.60;

export function useScan(): UseScanReturn {
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
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setCapturedUri(uri);
      setState('ANALYZING');
      await analyzePhoto(uri);
    }
  }, []);

  const analyzePhoto = useCallback(async (uri?: string) => {
    const imageUri = uri || capturedUri;
    if (!imageUri) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await predictBoth(imageUri);
      setScanResult(result);

      // Evaluate confidence for each field
      const skinTypeEval = evaluateConfidence('skinType', result.skinType);
      const acneSeverityEval = evaluateConfidence('acneSeverity', result.acneSeverity);

      setSkinTypeEvaluation(skinTypeEval);
      setAcneSeverityEvaluation(acneSeverityEval);

      setState('RESULT_REVIEW');
    } catch (err) {
      const error: InferenceError = {
        message: err instanceof Error ? err.message : 'Analysis failed',
        code: 'INFERENCE_ERROR',
      };
      setError(error);
      setState('ERROR_RETRY');
    } finally {
      setIsAnalyzing(false);
    }
  }, [capturedUri]);

  const evaluateConfidence = useCallback(
    (field: 'skinType' | 'acneSeverity', prediction: PredictResponse): ConfidenceEvaluation => {
      const isHighConfidence = prediction.confidence >= 0.60;
      return {
        field,
        confidence: prediction.confidence,
        isHighConfidence,
        actionLabel: isHighConfidence ? 'Looks right' : 'Accept',
        noticeText: !isHighConfidence ? 'The model was uncertain about this scan' : undefined,
      };
    },
    []
  );

  const acceptAIInputs = useCallback(() => {
    if (!scanResult) return;

    // Hydrate profile store with AI predictions
    setAIProfile({
      ai_skin_type: scanResult.skinType.label,
      ai_acne_severity: scanResult.acneSeverity.label,
      skin_type_confidence: scanResult.skinType.confidence,
      acne_severity_confidence: scanResult.acneSeverity.confidence,
      model_version: scanResult.skinType.model_version, // both use same model version
    });

    // Optionally navigate to verdict screen or stay on result review
    // For now, stay on result review to show acceptance
  }, [scanResult, setAIProfile]);

  const retakePhoto = useCallback(() => {
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