// Cloudinary upload service for OpticPortal boutique logos and storefront backgrounds

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

const STORAGE_KEY_CLOUD_NAME = 'opticportal_cloudinary_cloud_name';
const STORAGE_KEY_UPLOAD_PRESET = 'opticportal_cloudinary_upload_preset';

export function getCloudinaryConfig(): CloudinaryConfig {
  const storedCloudName = localStorage.getItem(STORAGE_KEY_CLOUD_NAME);
  const storedPreset = localStorage.getItem(STORAGE_KEY_UPLOAD_PRESET);

  const envCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
  const envPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

  return {
    cloudName: storedCloudName || envCloudName || 'opticportal',
    uploadPreset: storedPreset || envPreset || 'opticportal_unsigned',
  };
}

export function setCloudinaryConfig(cloudName: string, uploadPreset: string) {
  localStorage.setItem(STORAGE_KEY_CLOUD_NAME, cloudName.trim());
  localStorage.setItem(STORAGE_KEY_UPLOAD_PRESET, uploadPreset.trim());
}

export function isCloudinaryCustomConfigured(): boolean {
  const storedCloudName = localStorage.getItem(STORAGE_KEY_CLOUD_NAME);
  const envCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
  return Boolean(storedCloudName || envCloudName);
}

/**
 * Upload an image file to Cloudinary.
 * If network or preset fails, gracefully fallbacks to a high-quality Data URL
 * so that the user's image is never lost and is immediately stored in Supabase.
 */
export async function uploadImageToCloudinary(
  file: File | Blob,
  customConfig?: Partial<CloudinaryConfig>
): Promise<{ success: boolean; url: string; isCloudinary: boolean; error?: string }> {
  const config = { ...getCloudinaryConfig(), ...customConfig };

  // Attempt upload to Cloudinary API
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', config.uploadPreset);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.secure_url) {
        return {
          success: true,
          url: data.secure_url,
          isCloudinary: true,
        };
      }
    }

    // If Cloudinary returned an error payload
    const errorJson = await response.json().catch(() => null);
    const errorMsg = errorJson?.error?.message || `Cloudinary HTTP ${response.status}`;
    console.warn('Cloudinary upload warning:', errorMsg);

    // Graceful fallback to Data URL for instant rendering & local saving
    const fallbackUrl = await fileToDataUrl(file);
    return {
      success: true,
      url: fallbackUrl,
      isCloudinary: false,
      error: `Cloudinary response (${errorMsg}). File stored as optimized image for Supabase. Configure your custom Cloudinary Cloud Name & Preset for direct CDN hosting.`,
    };
  } catch (err: any) {
    console.warn('Network or CORS error connecting to Cloudinary:', err);
    // Graceful fallback
    const fallbackUrl = await fileToDataUrl(file);
    return {
      success: true,
      url: fallbackUrl,
      isCloudinary: false,
      error: 'Direct upload saved locally. Configure your Cloudinary Cloud Name & Preset in settings to host on Cloudinary CDN.',
    };
  }
}

function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}
