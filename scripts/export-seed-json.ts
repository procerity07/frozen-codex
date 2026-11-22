/* Writes data-pack/manifest.json from the bundled seed — host it on GitHub Pages / raw to drive OTA updates. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { events, giftCodes, heroes, sophiaQuestions } from '../src/data/seed';
import type { DataManifest } from '../src/types/game';

const version = Number(process.argv[2] ?? 1);
const manifest: DataManifest = { version, publishedAt: new Date().toISOString(), packs: { heroes, events, giftCodes, sophia: sophiaQuestions } };
const dir = join(__dirname, '..', 'data-pack');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Wrote data-pack/manifest.json v${version}: ${heroes.length} heroes, ${events.length} events, ${giftCodes.length} codes, ${sophiaQuestions.length} answers`);
