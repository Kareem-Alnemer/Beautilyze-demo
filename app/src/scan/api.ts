/**
 * Inference API client.
 * Per blueprint §8.3: Send camera capture via multipart upload to
 * /predict/skin-type and /predict/acne-severity.
 * Per blueprint §5.3: Execute both requests concurrently via Promise.all.
 */

import { PredictResponse, ScanResult } from './types';

/**
 * Get inference server URL from environment or fallback.
 * Uses EXPO_PUBLIC_INFERENCE_SERVER_URL with fallback to localhost.
 */
function getInferenceServerUrl(): string {
  // In Expo, process.env is not available at runtime.
  // Use Constants.expoConfig.extra or fallback.
  // For now, use a simple fallback. In production, this would come from app.config.js
  return process.env.EXPO_PUBLIC_INFERENCE_SERVER_URL || 'http://localhost:8000';
}

const INFERENCE_SERVER_URL = getInferenceServerUrl();

/**
 * Convert a local file URI to a Blob for FormData upload.
 * Works with Expo's file system URIs (file:// or content://).
 */
async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return response.blob();
}

/**
 * Predict skin type from image URI.
 * POSTs to /predict/skin-type with multipart/form-data.
 */
export async function predictSkinType(imageUri: string): Promise<PredictResponse> {
  const blob = await uriToBlob(imageUri);
  const formData = new FormData();
  formData.append('file', blob, 'image.jpg');

  const response = await fetch(`${INFERENCE_SERVER_URL}/predict/skin-type`, {
    method: 'POST',
    body: formData,
    headers: {
      // Don't set Content-Type - let browser set it with boundary
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `Skin type prediction failed: ${response.status}`
    );
  }

  return response.json();
}

/**
 * Predict acne severity from image URI.
 * POSTs to /predict/acne-severity with multipart/form-data.
 */
export async function predictAcneSeverity(imageUri: string): Promise<PredictResponse> {
  const blob = await uriToBlob(imageUri);
  const formData = new FormData();
  formData.append('file', blob, 'image.jpg');

  const response = await fetch(`${INFERENCE_SERVER_URL}/predict/acne-severity`, {
    method: 'POST',
    body: formData,
    headers: {
      // Don't set Content-Type - let browser set it with boundary
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `Acne severity prediction failed: ${response.status}`
    );
  }

  return response.json();
}

/**
 * Run both predictions concurrently.
 * Per blueprint §5.3: Per-field parallel contracts.
 * Returns combined ScanResult.
 */
export async function predictBoth(imageUri: string): Promise<ScanResult> {
  const [skinType, acneSeverity] = await Promise.all([
    predictSkinType(imageUri),
    predictAcneSeverity(imageUri),
  ]);

  return {
    skinType,
    acneSeverity,
    capturedUri: imageUri,
    timestamp: Date.now(),
  };
}

// Re-export types for convenience
export type { PredictResponse, ScanResult } from './types';
