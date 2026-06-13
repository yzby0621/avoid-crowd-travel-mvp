import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

const envFiles = ['.env.local', '.env'];

for (const filename of envFiles) {
  const filePath = path.join(rootDir, filename);
  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath, override: false });
  }
}

export function getEnv(name, fallback = undefined) {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}
