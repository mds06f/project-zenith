/**
 * File: scripts/copy-cesium-assets.mjs
 * Purpose: Cesium ships static Workers/Assets/Widgets/ThirdParty folders that the
 *          browser must fetch at runtime. Bundlers don't move them automatically,
 *          so we copy them into /public/cesium (matching CESIUM_BASE_URL).
 *
 * Runs automatically on `npm install` (see package.json "postinstall").
 * Safe to re-run; it overwrites the target each time.
 *
 * Edge cases:
 *  - If `cesium` isn't installed yet (e.g. fresh clone before deps), it logs a
 *    warning and exits 0 so install isn't blocked.
 */
import { cp, mkdir, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', 'cesium', 'Build', 'Cesium');
const dest = join(root, 'public', 'cesium');
const folders = ['Workers', 'Assets', 'Widgets', 'ThirdParty'];

try {
  await access(src);
} catch {
  console.warn('[cesium] node_modules/cesium not found yet — skipping asset copy.');
  process.exit(0);
}

await mkdir(dest, { recursive: true });
for (const folder of folders) {
  await cp(join(src, folder), join(dest, folder), { recursive: true });
}
console.log('[cesium] static assets copied to public/cesium');
