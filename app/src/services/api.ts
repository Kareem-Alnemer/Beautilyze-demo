/**
 * API Service for BeautiLyze Mobile App
 * Handles communication with the inference server
 */

import { Platform } from 'react-native';

// Types
export interface SkinTypeResult {
  label: 'dry' | 'normal' | 'oily' | 'combination';
  confidence: number;
}

export interface AcneSeverityResult {
  label: 'mild' | 'moderate' | 'severe';
  confidence: number;
}

export interface ScanData {
  skin_type: SkinTypeResult;
  acne_severity: AcneSeverityResult;
}

export interface ScanRecord {
  id: string;
  created_at: string;
  user_id?: string;
  skin_type: string;
  skin_confidence: number;
  acne_severity: string;
  acne_confidence: number;
}

export interface AnalyzeResponse {
  status: 'success' | 'partial';
  data: ScanData;
  db_record: ScanRecord | null;
}

export interface UploadScanOptions {
  imageUri: string;
  userToken?: string;
  onProgress?: (progress: number) => void;
}

/**
 * Get the inference server URL from environment
 * Falls back to localhost for development
 */
function getInferenceServerUrl(): string {
  // Expo reads EXPO_PUBLIC_* vars at build time
  const url = process.env.EXPO_PUBLIC_INFERENCE_SERVER_URL;
  if (url) return url;

  // Development fallback
  if (__DEV__) {
    // On Android emulator, localhost refers to the emulator itself
    // Use 10.0.2.2 to reach host machine
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8000';
    }
    // iOS simulator and web can use localhost
    return 'http://127.0.0.1:8000';
  }

  throw new Error('EXPO_PUBLIC_INFERENCE_SERVER_URL is not configured');
}

/**
 * Upload an image for skin analysis
 * @param options - Upload options including image URI and optional auth token
 * @returns Promise resolving to the analysis response
 */
export async function uploadScanImage({
  imageUri,
  userToken,
  onProgress,
}: UploadScanOptions): Promise<AnalyzeResponse> {
  const url = `${getInferenceServerUrl()}/analyze`;

  // Create FormData
  const formData = new FormData();

  // Determine file extension and MIME type
  const extension = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
  const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';

  // Append file to FormData
  // React Native requires a specific format for file uploads
  formData.append('file', {
    uri: imageUri,
    name: `scan_${Date.now()}.${extension}`,
    type: mimeType,
  } as any);

  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'multipart/form-data',
  };

  // Add Authorization header if token provided
  if (userToken) {
    headers['Authorization'] = `Bearer ${userToken}`;
  }

  try {
    // Use fetch with progress tracking if onProgress provided
    const response = await fetchWithProgress(url, {
      method: 'POST',
      headers,
      body: formData,
      onProgress,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Upload failed with status ${response.status}`
      );
    }

    const data = await response.json();
    return data as AnalyzeResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error during upload');
  }
}

/**
 * Fetch with progress tracking
 * Wraps fetch to provide upload progress updates
 */
async function fetchWithProgress(
  url: string,
  options: RequestInit & { onProgress?: (progress: number) => void }
): Promise<Response> {
  const { onProgress, ...fetchOptions } = options;

  if (!onProgress) {
    return fetch(url, fetchOptions);
  }

  // For progress tracking, we need to use XMLHttpRequest
  // since fetch doesn't support upload progress natively
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = event.loaded / event.total;
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      const response = new Response(xhr.response, {
        status: xhr.status,
        statusText: xhr.statusText,
        headers: new Headers(
          xhr
            .getAllResponseHeaders()
            .split('\r\n')
            .filter((h) => h)
            .map((h) => h.split(': '))
        ),
      });
      resolve(response);
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'));
    });

    xhr.open(fetchOptions.method || 'POST', url);

    // Set headers
    if (fetchOptions.headers) {
      const headers = fetchOptions.headers as Record<string, string>;
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
    }

    xhr.send(fetchOptions.body as FormData);
  });
}

/**
 * Check inference server health
 */
export async function checkServerHealth(): Promise<{
  status: string;
  model_mode: string;
  model_version: string;
}> {
  const url = `${getInferenceServerUrl()}/health`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }

  return response.json();
}

export default {
  uploadScanImage,
  checkServerHealth,
};