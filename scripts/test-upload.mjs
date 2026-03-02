import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

function parseDotEnv(path) {
  try {
    const raw = fs.readFileSync(path, 'utf8');
    const lines = raw.split(/\r?\n/);
    const env = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      env[key] = val.replace(/^"|"$/g, '');
    }
    return env;
  } catch (e) {
    return {};
  }
}

const env = parseDotEnv('.env');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials. Check .env or environment variables.');
  process.exit(2);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  try {
    const bucket = 'dogs';
    const filePath = `dog-photos/test-upload-${Date.now()}.txt`;
    const content = `test upload ${new Date().toISOString()}`;
    const buf = Buffer.from(content, 'utf8');

    console.log('Uploading to', bucket, filePath);
    const { data, error } = await supabase.storage.from(bucket).upload(filePath, buf, { upsert: true });
    if (error) {
      console.error('Upload error:', error);
      process.exitCode = 3;
      return;
    }
    console.log('Upload succeeded:', data);

    const listRes = await supabase.storage.from(bucket).list('dog-photos');
    console.log('List dog-photos:', listRes);

    const signed = await supabase.storage.from(bucket).createSignedUrl(filePath, 60);
    console.log('Signed URL:', signed);

    // Try to HEAD the signed URL
    if (signed?.data?.signedUrl) {
      try {
        const res = await fetch(signed.data.signedUrl, { method: 'HEAD' });
        console.log('HEAD status:', res.status);
      } catch (e) {
        console.warn('HEAD request failed:', e.message || e);
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exitCode = 4;
  }
}

run();
