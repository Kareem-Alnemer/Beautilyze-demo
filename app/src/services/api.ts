import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_INFERENCE_SERVER_URL || 'https://beautilyze-api.onrender.com';

export interface UploadOptions {
  imageUri: string;
  userToken?: string;
  onProgress?: (progress: number) => void;
}

export interface AnalyzeResponse {
  status: string;
  data: {
    skin_type: { label: string; confidence: number };
    acne_severity: { label: string; confidence: number };
  };
  db_record?: any;
}

export async function uploadScanImage({ imageUri, userToken, onProgress }: UploadOptions): Promise<AnalyzeResponse> {
  if (!imageUri) {
    throw new Error('No image URI provided.');
  }

  // Format URI cleanly for Android / iOS
  let formattedUri = imageUri;
  if (Platform.OS === 'android' && !formattedUri.startsWith('file://') && !formattedUri.startsWith('content://')) {
    formattedUri = `file://${formattedUri}`;
  }

  // Determine file name and MIME type safely
  const filename = formattedUri.split('/').pop() || 'scan.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';

  const formData = new FormData();

  // React Native expects strictly string values for uri, name, and type
  formData.append('file', {
    uri: formattedUri,
    name: filename,
    type: type,
  } as any);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const cleanBaseUrl = API_URL.replace(/\/$/, '');
    const endpoint = `${cleanBaseUrl}/analyze`;

    xhr.open('POST', endpoint);

    if (userToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${userToken}`);
    }

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(event.loaded / event.total);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (e) {
          reject(new Error('Failed to parse server response.'));
        }
      } else {
        reject(new Error(`Server error (${xhr.status}): ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network request failed. Check server status or internet connection.'));
    };

    xhr.send(formData);
  });
}

export async function checkServerHealth(): Promise<boolean> {
  try {
    const cleanBaseUrl = API_URL.replace(/\/$/, '');
    const response = await fetch(`${cleanBaseUrl}/health`);
    return response.ok;
  } catch {
    return false;
  }
}