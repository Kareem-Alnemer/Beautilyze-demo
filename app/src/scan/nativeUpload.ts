import { requireOptionalNativeModule } from 'expo';
import { validatePrediction } from './api';
import type { ScanResult } from './types';

interface MemoryUploadModule {
  pickAndAnalyze(serverUrl: string): Promise<string | null>;
}

export async function pickAndAnalyzeNative(): Promise<ScanResult | null> {
  const native = requireOptionalNativeModule<MemoryUploadModule>('BeautilyzeMemoryUpload');
  if (!native) {
    throw new Error('Photo upload requires the BeautiLyze native build. Expo Go does not include it.');
  }
  const serverUrl = process.env.EXPO_PUBLIC_INFERENCE_SERVER_URL;
  if (!serverUrl || !serverUrl.startsWith('https://')) {
    throw new Error('Photo upload needs an HTTPS inference server configured for this build.');
  }
  const json = await native.pickAndAnalyze(serverUrl);
  if (json === null) return null;
  const response = JSON.parse(json);
  if (response?.status !== 'success' || !response.data) throw new Error('Invalid analysis response');
  return {
    skinType: validatePrediction(response.data.skin_type, ['dry', 'normal', 'oily']),
    acneSeverity: validatePrediction(response.data.acne_severity, ['mild', 'moderate', 'severe']),
    capturedUri: '',
    timestamp: Date.now(),
  };
}
