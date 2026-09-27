import { requireOptionalNativeModule } from 'expo';
import { pickAndAnalyzeNative } from '../nativeUpload';

jest.mock('expo', () => ({ requireOptionalNativeModule: jest.fn() }));
const pick = jest.fn();
const originalUrl = process.env.EXPO_PUBLIC_INFERENCE_SERVER_URL;
const response = {
  status: 'success',
  data: {
    skin_type: { label: 'oily', confidence: 0.7, model_version: 'skin-test' },
    acne_severity: { label: 'mild', confidence: 0.8, model_version: 'acne-test' },
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_INFERENCE_SERVER_URL = 'https://inference.example.test';
  (requireOptionalNativeModule as jest.Mock).mockReturnValue({ pickAndAnalyze: pick });
});
afterAll(() => {
  if (originalUrl === undefined) delete process.env.EXPO_PUBLIC_INFERENCE_SERVER_URL;
  else process.env.EXPO_PUBLIC_INFERENCE_SERVER_URL = originalUrl;
});

it('explains that Expo Go cannot supply the native module', async () => {
  (requireOptionalNativeModule as jest.Mock).mockReturnValue(null);
  await expect(pickAndAnalyzeNative()).rejects.toThrow('Expo Go');
});
it('refuses a plaintext upload endpoint before opening the picker', async () => {
  process.env.EXPO_PUBLIC_INFERENCE_SERVER_URL = 'http://localhost:8000';
  await expect(pickAndAnalyzeNative()).rejects.toThrow('HTTPS');
  expect(pick).not.toHaveBeenCalled();
});
it('treats selection cancellation as no result', async () => {
  pick.mockResolvedValueOnce(null);
  await expect(pickAndAnalyzeNative()).resolves.toBeNull();
});
it('validates both predictions without returning an image URI', async () => {
  pick.mockResolvedValueOnce(JSON.stringify(response));
  const result = await pickAndAnalyzeNative();
  expect(result?.skinType).toEqual(response.data.skin_type);
  expect(result?.acneSeverity).toEqual(response.data.acne_severity);
  expect(result?.capturedUri).toBe('');
});
it('rejects an acne label in the skin field', async () => {
  pick.mockResolvedValueOnce(JSON.stringify({ ...response, data: {
    ...response.data, skin_type: { ...response.data.skin_type, label: 'severe' },
  } }));
  await expect(pickAndAnalyzeNative()).rejects.toThrow('Invalid prediction');
});
it('rejects a partial result rather than presenting an invented prediction', async () => {
  pick.mockResolvedValueOnce(JSON.stringify({ ...response, status: 'partial' }));
  await expect(pickAndAnalyzeNative()).rejects.toThrow('Invalid analysis');
});
it('surfaces a native upload failure', async () => {
  pick.mockRejectedValueOnce(new Error('Connection failed'));
  await expect(pickAndAnalyzeNative()).rejects.toThrow('Connection failed');
});
