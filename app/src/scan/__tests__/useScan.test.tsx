import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useScan } from '../hooks/useScan';
import { pickAndAnalyzeNative } from '../nativeUpload';

jest.mock('../nativeUpload', () => ({ pickAndAnalyzeNative: jest.fn() }));
jest.mock('expo-camera', () => ({ Camera: {
  getCameraPermissionsAsync: jest.fn(async () => ({ status: 'denied' })),
} }));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('../../profile/store', () => ({ useProfileStore: (select: any) => select({ setAIProfile: jest.fn() }) }));

const result = {
  skinType: { label: 'oily', confidence: 0.7, model_version: 'skin-test' },
  acneSeverity: { label: 'mild', confidence: 0.5, model_version: 'acne-test' },
  capturedUri: '', timestamp: 0,
};
beforeEach(() => jest.clearAllMocks());

it('allows native gallery analysis without camera permission', async () => {
  (pickAndAnalyzeNative as jest.Mock).mockResolvedValueOnce(result);
  const screen = renderHook(() => useScan());
  await waitFor(() => expect(screen.result.current.cameraPermission).toBe('denied'));
  await act(async () => { await screen.result.current.pickFromGallery(); });
  expect(screen.result.current.state).toBe('RESULT_REVIEW');
  expect(screen.result.current.capturedUri).toBeNull();
  expect(screen.result.current.acneSeverityEvaluation?.actionLabel).toBe('Accept');
});

it('returns to permissions after cancelling without an error', async () => {
  (pickAndAnalyzeNative as jest.Mock).mockResolvedValueOnce(null);
  const screen = renderHook(() => useScan());
  await waitFor(() => expect(screen.result.current.cameraPermission).toBe('denied'));
  await act(async () => { await screen.result.current.pickFromGallery(); });
  expect(screen.result.current.state).toBe('PERMISSIONS_REQUIRED');
  expect(screen.result.current.error).toBeNull();
  expect(screen.result.current.isAnalyzing).toBe(false);
});

it('shows a failed native upload as a recoverable error', async () => {
  (pickAndAnalyzeNative as jest.Mock).mockRejectedValueOnce(new Error('Upload unavailable'));
  const screen = renderHook(() => useScan());
  await waitFor(() => expect(screen.result.current.cameraPermission).toBe('denied'));
  await act(async () => { await screen.result.current.pickFromGallery(); });
  expect(screen.result.current.state).toBe('ERROR_RETRY');
  expect(screen.result.current.error?.message).toBe('Upload unavailable');
});

it('ignores a late result after leaving the current analysis', async () => {
  let finish!: (value: typeof result) => void;
  (pickAndAnalyzeNative as jest.Mock).mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
  const screen = renderHook(() => useScan());
  await waitFor(() => expect(screen.result.current.cameraPermission).toBe('denied'));
  let pending!: Promise<void>;
  act(() => { pending = screen.result.current.pickFromGallery(); });
  act(() => screen.result.current.retakePhoto());
  await act(async () => { finish(result); await pending; });
  expect(screen.result.current.scanResult).toBeNull();
});

it('does not launch another picker while one is outstanding', async () => {
  let finish!: (value: null) => void;
  (pickAndAnalyzeNative as jest.Mock).mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
  const screen = renderHook(() => useScan());
  await waitFor(() => expect(screen.result.current.cameraPermission).toBe('denied'));
  let pending!: Promise<void>;
  act(() => { pending = screen.result.current.pickFromGallery(); });
  await act(async () => { await screen.result.current.pickFromGallery(); });
  expect(pickAndAnalyzeNative).toHaveBeenCalledTimes(1);
  await act(async () => { finish(null); await pending; });
});
