/**
 * Cloudinary Upload Service for CINEVERSE
 * Uploads images straight from the browser to Cloudinary CDN. The upload is
 * signed by the backend (/api/uploads/cloudinary-signature), so the API secret
 * never reaches the browser. An unsigned upload preset is used instead when
 * VITE_CLOUDINARY_UPLOAD_PRESET is set.
 */
import { apiPost } from './apiClient';

export const isCloudinaryConfigured = Boolean(
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
);

/**
 * Upload an image file to Cloudinary
 * @param {File|Blob} file - The image file to upload
 * @param {Object} options - Optional callbacks or settings
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export async function uploadImageToCloudinary(file, { onProgress } = {}) {
  const uploadPreset = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '').trim();
  let cloudName = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '').trim();

  const formData = new FormData();
  formData.append('file', file);

  if (uploadPreset) {
    if (!cloudName) {
      throw new Error('VITE_CLOUDINARY_CLOUD_NAME is required for unsigned uploads.');
    }
    formData.append('upload_preset', uploadPreset);
  } else {
    // Ask the backend to sign this upload.
    const signed = await apiPost('/api/uploads/cloudinary-signature');
    cloudName = signed.cloudName;
    formData.append('api_key', signed.apiKey);
    formData.append('timestamp', String(signed.timestamp));
    formData.append('folder', signed.folder);
    formData.append('signature', signed.signature);
  }

  const uploadEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadEndpoint, true);

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            url: response.secure_url || response.url,
            publicId: response.public_id,
            width: response.width,
            height: response.height,
            format: response.format,
          });
        } else {
          const errMsg = response.error?.message || `Upload failed with HTTP ${xhr.status}`;
          reject(new Error(errMsg));
        }
      } catch (err) {
        reject(new Error(`Failed to parse Cloudinary response: ${err.message}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error occurred while uploading to Cloudinary.'));
    };

    xhr.send(formData);
  });
}
