import { supabase } from "./supabaseClient";

const BUCKET = "dogs";

export async function uploadDogPhoto(file, userId) {
  if (!file) return { error: "no-file" };
  const fileExt = (file.name || "").split(".").pop();
  const fileName = `${userId || "anon"}-${Date.now()}.${fileExt || 'jpg'}`;
  const filePath = `dog-photos/${fileName}`;

  try {
    // allow upsert to avoid failures when re-uploading during development
    const { data, error } = await supabase.storage.from(BUCKET).upload(filePath, file, { upsert: true });
    if (error) return { error };

    // try to get a usable public URL (public bucket) or a signed URL fallback
    const publicUrl = await getPublicUrl(filePath);

    return { data, error: null, filePath, publicUrl };
  } catch (err) {
    return { error: err };
  }
}

export async function getPublicUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;

  try {
    const { data, error } = await supabase.storage.from(BUCKET).getPublicUrl(path);
    const pub = data?.publicUrl || null;
    if (pub) {
      // quick HEAD check to ensure the URL is reachable; if not, fall back to signed URL
      try {
        const res = await fetch(pub, { method: 'HEAD' });
        if (res.ok) return pub;
      } catch (e) {
        // ignore and fall back
      }
    }

    // fallback to signed URL for private buckets (expires in 60s)
    try {
      const { data: signed, error: signedErr } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60);
      if (signedErr) return pub;
      return signed?.signedUrl || pub;
    } catch (e) {
      return pub;
    }
  } catch (err) {
    return null;
  }
}

export async function listDogPhotos(prefix = "") {
  try {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix);
    return { data, error };
  } catch (err) {
    return { error: err };
  }
}
