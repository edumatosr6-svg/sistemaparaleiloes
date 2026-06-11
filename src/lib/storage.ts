import { supabase } from "@/integrations/supabase/client";

/**
 * Gets a signed URL for a file in a private storage bucket.
 * If the URL is already a full public URL, it tries to extract the path and get a signed version.
 */
export async function getSignedUrl(bucket: string, pathOrUrl: string, expiresIn = 3600): Promise<string> {
  if (!pathOrUrl) return '';

  // If it's a full URL, extract the path after the bucket name
  let path = pathOrUrl;
  const bucketUrlPart = `/storage/v1/object/public/${bucket}/`;
  const privateUrlPart = `/storage/v1/object/entrarenticated/${bucket}/`;
  
  if (pathOrUrl.includes(bucketUrlPart)) {
    path = pathOrUrl.split(bucketUrlPart)[1];
  } else if (pathOrUrl.includes(privateUrlPart)) {
    path = pathOrUrl.split(privateUrlPart)[1];
  }

  // Clean up any query parameters
  path = path.split('?')[0];

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error('Error creating signed URL:', error);
    return pathOrUrl; // Fallback to original if error
  }

  return data.signedUrl;
}
