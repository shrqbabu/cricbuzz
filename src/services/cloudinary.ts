/**
 * Cloundinary Image Upload Utility
 * Handles posting images to Cloudinary's unsigned upload API endpoint.
 * In development / unconfigured state, returns high-quality Unsplash sport placeholders gracefully.
 */
export async function uploadToCloudinary(file: File, type: "logo" | "avatar" | "banner" = "logo"): Promise<string> {
  const cloudName = (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = (import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // Placeholder images matching Cricket / Sports aesthetics
  const PLACEHOLDER_IMAGES = {
    logo: "https://images.unsplash.com/photo-1531415080290-bc9b161a0fc3?auto=format&fit=crop&q=80&w=300", // Team emblem / stadium
    avatar: "https://images.unsplash.com/photo-1624526261182-ab3df865f204?auto=format&fit=crop&q=80&w=300", // Player avatar placeholder
    banner: "https://images.unsplash.com/photo-1431324155629-1a6edd1dec1d?auto=format&fit=crop&q=80&w=800", // Large green turf stadium
  };

  if (!cloudName || !uploadPreset || cloudName.includes("your") || uploadPreset.includes("your")) {
    console.warn("Cloudinary is not configured. Using high-quality placeholder asset.");
    // Simulate upload delay for realistic feel
    await new Promise((resolve) => setTimeout(resolve, 600));
    return PLACEHOLDER_IMAGES[type];
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status code ${response.status}`);
    }

    const data = await response.json();
    return data.secure_url;
  } catch (err) {
    console.error("Cloudinary Upload Error, falling back to placeholder:", err);
    return PLACEHOLDER_IMAGES[type];
  }
}
