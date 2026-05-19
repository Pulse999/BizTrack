// backend/src/services/supabase.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Bucket names (falls back to literal names if environment doesn't set them)
export const COURSE_IMAGES_BUCKET =
  process.env.SUPABASE_COURSE_IMAGES_BUCKET || "Course Images";
export const PROFILE_BUCKET =
  process.env.SUPABASE_PROFILE_BUCKET || "profile-pictures";
export const CERT_BUCKET =
  process.env.SUPABASE_CERT_BUCKET || "certificates";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. Supabase backend client may be unavailable."
  );
}

// Create a Supabase client using the Service Role key (server-side only).
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Convenience: a storage "bucket handle" for certificates (server-side).
 * Usage: await certBucket.upload(path, file, options)
 */
export const certBucket = supabase.storage.from(CERT_BUCKET);

/**
 * Extract object path from a Supabase public URL for the given bucket.
 * Returns null if it cannot be determined.
 *
 * Examples of publicUrl:
 * - https://<SUPABASE_URL>/storage/v1/object/public/Course%20Images/dir/file.jpg
 * - https://<SUPABASE_URL>/storage/v1/object/public/Course Images/dir/file.jpg
 */
export function extractObjectPathFromPublicUrl(
  publicUrl: string,
  bucketName: string
): string | null {
  if (!publicUrl || !bucketName) return null;
  try {
    const u = new URL(publicUrl);
    // decode, because bucket or path may be URL-encoded
    const decodedPath = decodeURIComponent(u.pathname || "");
    const marker = `/storage/v1/object/public/${bucketName}/`;
    const idx = decodedPath.indexOf(marker);
    if (idx === -1) return null;
    return decodedPath.substring(idx + marker.length);
  } catch (err) {
    return null;
  }
}

/**
 * Remove object(s) by public URL (single) from a given bucket.
 * Returns true if removed (or nothing to remove), false if removal failed.
 * Errors are logged but not thrown (caller should handle behavior).
 */
export async function removeObjectByPublicUrl(
  publicUrl: string | null | undefined,
  bucketName = COURSE_IMAGES_BUCKET
): Promise<boolean> {
  if (!publicUrl) return true;

  const objectPath = extractObjectPathFromPublicUrl(publicUrl, bucketName);
  if (!objectPath) {
    // Not a storage public URL we can parse — nothing to delete
    return true;
  }

  try {
    const { error } = await supabase.storage.from(bucketName).remove([objectPath]);
    if (error) {
      console.error("[supabase] remove failed:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[supabase] remove exception:", err);
    return false;
  }
}

/**
 * Build public url for a bucket + path using supabase client.
 * This simply returns same format supabase.getPublicUrl returns.
 */
export function buildPublicUrl(bucketName: string, path: string): string {
  // supabase client exposes getPublicUrl, but this helper is handy.
  try {
    const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
    return data?.publicUrl || "";
  } catch (err) {
    // Fallback: construct URL manually (works if SUPABASE_URL is set)
    if (!SUPABASE_URL) return "";
    const cleanBase = SUPABASE_URL.replace(/\/$/, "");
    // encode path segments
    const encoded = encodeURIComponent(path).replace(/%2F/g, "/");
    return `${cleanBase}/storage/v1/object/public/${bucketName}/${encoded}`;
  }
}
