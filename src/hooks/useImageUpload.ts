import { useState } from 'react';
import { uploadToCloudinary } from '../services/cloudinary';

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File): Promise<string | null> => {
    setUploading(true);
    setError(null);
    try {
      const result = await uploadToCloudinary(file);
      return result.secure_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, error };
}
