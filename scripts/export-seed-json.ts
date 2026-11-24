/*
 * Writes data-pack/manifest.json from the bundled data. Phones download it automatically, so data fixes
 * (heroes, events, Sophia questions, gift codes, shops) reach them without a new APK.
 * The version only goes up when the content actually changed. Run: npm run pack
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { packContent } from './pack-content';

const file = join(__dirname, '..', 'data-pack', 'manifest.json');
const packs = packContent();
const prev = existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as { version?: number; publishedAt?: string; packs?: unknown }) : {};
const changed = JSON.stringify(prev.packs ?? null) !== JSON.stringify(packs);
const version = (prev.version ?? 0) + (changed ? 1 : 0);
const manifest = { version, publishedAt: changed ? new Date().toISOString() : prev.publishedAt ?? new Date().toISOString(), packs };
mkdirSync(join(__dirname, '..', 'data-pack'), { recursive: true });
writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n');
console.log(changed ? `Data pack updated to v${version}.` : `Data pack v${version} already up to date.`);
