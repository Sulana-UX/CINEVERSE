/**
 * Cloudinary Upload Service for CINEVERSE
 * Handles client-side image uploads directly to Cloudinary CDN
 * Stores CDN image URLs (https://res.cloudinary.com/...) in the Supabase database.
 */

// Helper to calculate SHA-1 hex digest using native Web Crypto API
async function calculateSha1(input) {
  const enc = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-1', enc.encode(input));
  const byteArray = Array.from(new Uint8Array(buffer));
  return byteArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

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
  const cloudName = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '').trim();
  const apiKey = (import.meta.env.VITE_CLOUDINARY_API_KEY || '373352494151775').trim();
  const apiSecret = (import.meta.env.VITE_CLOUDINARY_API_SECRET || 'axbhhWhsJCM60rq0tlKkvY3oQyc').trim();
  const uploadPreset = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '').trim();

  if (!cloudName) {
    throw new Error(
      'Cloudinary Cloud Name is missing. Please add VITE_CLOUDINARY_CLOUD_NAME to your .env file.'
    );
  }

  const formData = new FormData();
  formData.append('file', file);

  // If unsigned upload preset is configured, use it
  if (uploadPreset) {
    formData.append('upload_preset', uploadPreset);
  } else if (apiSecret) {
    // Generate signed upload parameters using API Key and Secret
    const timestamp = Math.floor(Date.now() / 1000);
    // Cloudinary signature parameter string (timestamp={timestamp}{api_secret})
    const signature = await calculateSha1(`timestamp=${timestamp}${apiSecret}`);

    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);
  } else {
    throw new Error('Cloudinary requires either an upload preset or API Secret.');
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
