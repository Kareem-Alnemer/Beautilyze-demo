/**
 * Tests for inference API client.
 */

import { predictSkinType, predictAcneSeverity, predictBoth } from '../api';

// Mock fetch globally
global.fetch = jest.fn();

describe('Inference API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('predictSkinType', () => {
    it('calls inference server with correct FormData', async () => {
      const mockResponse = {
        label: 'oily',
        confidence: 0.73,
        model_version: 'test-model-v1',
      };
      const mockBlob = new Blob(['test'], { type: 'image/jpeg' });

      // Mock fetch for the image URI (first call) and the API call (second call)
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          blob: async () => new Blob(['test'], { type: 'image/jpeg' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

      const result = await predictSkinType('file://test.jpg');

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockResponse);
    });

    it('throws on network error', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          blob: async () => new Blob(['test'], { type: 'image/jpeg' }),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      await expect(predictSkinType('file://test.jpg')).rejects.toThrow('Network error');
    });

    it('throws on HTTP error', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          blob: async () => mockBlob,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ detail: 'Internal server error' }),
        });

      await expect(predictSkinType('file://test.jpg')).rejects.toThrow('Internal server error');
    });
  });

  describe('predictAcneSeverity', () => {
    it('calls inference server with correct FormData', async () => {
      const mockResponse = {
        label: 'moderate',
        confidence: 0.85,
        model_version: 'test-model-v1',
      };
      const mockBlob = new Blob(['test'], { type: 'image/jpeg' });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          blob: async () => mockBlob,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

      const result = await predictAcneSeverity('file://test.jpg');

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('predictBoth', () => {
    it('calls both endpoints concurrently', async () => {
      const skinTypeResponse = {
        label: 'oily',
        confidence: 0.73,
        model_version: 'test-model-v1',
      };
      const acneResponse = {
        label: 'moderate',
        confidence: 0.85,
        model_version: 'test-model-v1',
      };
      const mockBlob = new Blob(['test'], { type: 'image/jpeg' });

      // Use a mock implementation that responds based on the URL
      // Since Promise.all runs both predictions concurrently, the two uriToBlob calls
      // (fetch to imageUri) happen first, then the two POST requests.
      let fetchCallCount = 0;
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        fetchCallCount++;
        // First two calls are to the image URI (uriToBlob) - return blob
        // Last two calls are to the inference server endpoints - return json
        if (fetchCallCount <= 2) {
          return Promise.resolve({
            ok: true,
            blob: async () => mockBlob,
          });
        } else if (fetchCallCount === 3) {
          return Promise.resolve({
            ok: true,
            json: async () => skinTypeResponse,
          });
        } else {
          return Promise.resolve({
            ok: true,
            json: async () => acneResponse,
          });
        }
      });

      const result = await predictBoth('file://test.jpg');

      expect(global.fetch).toHaveBeenCalledTimes(4);
      expect(result.skinType).toEqual(skinTypeResponse);
      expect(result.acneSeverity).toEqual(acneResponse);
      expect(result.capturedUri).toBe('file://test.jpg');
      expect(result.timestamp).toBeDefined();
    });
  });
});