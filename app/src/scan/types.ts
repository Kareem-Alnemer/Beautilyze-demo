/**
 * Scan workflow types.
 * Per blueprint §5.1 (Scan User Flow), §5.3 (Per-Field Parallel Contracts),
 * §5.4 (Confidence Threshold & UI Behavior).
 */

import { SkinType, AcneSeverity } from '../verdict/types';

/**
 * Camera permission status.
 */
export type CameraPermissionStatus =
  | 'undetermined'
  | 'granted'
  | 'denied';

/**
 * Scan workflow states.
 * Per blueprint §5.1: Photo capture → Inference API request → Confidence evaluation → Profile store updates
 */
export type ScanState =
  | 'PERMISSIONS_REQUIRED'
  | 'CAMERA_ACTIVE'
  | 'ANALYZING'
  | 'RESULT_REVIEW'
  | 'ERROR_RETRY';

/**
 * Inference API response.
 * Per blueprint §5.2 AI Output Contract.
 */
export interface PredictResponse {
  label: SkinType | AcneSeverity;
  confidence: number; // 0.0 - 1.0, raw softmax output
  model_version: string;
}

/**
 * Combined scan result from both inference endpoints.
 */
export interface ScanResult {
  skinType: PredictResponse;
  acneSeverity: PredictResponse;
  capturedUri: string;
  timestamp: number;
}

/**
 * Confidence evaluation result per field.
 * Per blueprint §5.4: threshold 0.60
 */
export interface ConfidenceEvaluation {
  field: 'skinType' | 'acneSeverity';
  confidence: number;
  isHighConfidence: boolean; // >= 0.60
  actionLabel: 'Looks right' | 'Accept'; // button label
  noticeText?: string; // "The model was uncertain about this scan" for < 0.60
}

/**
 * Camera capture result.
 */
export interface CameraCaptureResult {
  uri: string;
  width: number;
  height: number;
  type: 'camera' | 'gallery';
}

/**
 * Inference API error.
 */
export interface InferenceError {
  message: string;
  code?: string;
  status?: number;
}

/**
 * Scan hook return type.
 */
export interface UseScanReturn {
  // State
  state: ScanState;
  cameraPermission: CameraPermissionStatus;
  capturedUri: string | null;
  scanResult: ScanResult | null;
  error: InferenceError | null;
  isAnalyzing: boolean;

  // Confidence evaluations
  skinTypeEvaluation: ConfidenceEvaluation | null;
  acneSeverityEvaluation: ConfidenceEvaluation | null;

  // Actions
  requestCameraPermission: () => Promise<void>;
  takePhoto: () => Promise<void>;
  pickFromGallery: () => Promise<void>;
  analyzePhoto: () => Promise<void>;
  acceptAIInputs: () => void;
  retakePhoto: () => void;
  retryAnalysis: () => Promise<void>;
  dismissError: () => void;
}