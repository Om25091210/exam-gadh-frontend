import type { PresignedPost } from '@eg/api';

/** Uploads a file straight to S3 with the signed form from the API (the API never handles the bytes). */
export async function uploadToS3(post: PresignedPost, file: Blob): Promise<void> {
  if (file.size > post.maxBytes) throw new Error('TOO_LARGE');
  const form = new FormData();
  for (const [k, v] of Object.entries(post.fields)) form.append(k, v);
  form.append('file', file); // must be last
  const res = await fetch(post.url, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`UPLOAD_${res.status}`);
}
