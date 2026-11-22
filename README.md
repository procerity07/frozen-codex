# Frozen Codex

An offline-first Android companion for *Puzzles & Chaos: Frozen Castle*: hero codex, event calendar and war room, calculators, and a daily checklist. It is an unofficial fan project and is not affiliated with 37GAMES.

## Structure

| Path | Purpose |
| --- | --- |
| `app/(tabs)/` | Command dashboard, Heroes, Events, Citadel, Guides |
| `app/hero/[id]`, `app/event/[id]` | Detail screens |
| `app/tools/` | Sophia lookup, Gift Code Vault, Bag Hoard, Citadel Planner, Sanctuary Guard, War Room, Settings |
| `src/theme/` | Glacial Obsidian & Citadel Gold tokens and type scale |
| `src/types/game.ts` | Strict schemas for every entity |
| `src/data/seed/` | Bundled datasets (48 heroes, 59 events, 84 Sophia answers, 12 shops, Citadel 1–40, gear/rune/totem/holystone/draconic tables) |
| `src/db/` | expo-sqlite migrations, FTS5 search, seeding, OTA manifest merge |
| `src/lib/` | Pure logic: UTC/cycle time, calculators, double-dip planner, fuzzy search, mail templates |
| `src/store/` | Zustand + AsyncStorage persisted profile |
| `src/services/` | Notifications, JSON backup/restore |
| `scripts/` | Seed validation (runs real SQL on SQLite), manifest export, icon rendering |

## Data confidence

Every hero, event and table row has a `confidence` flag (`verified` / `community` / `estimate`). The UI marks anything that isn't verified. Modelled numeric tables (Citadel costs and timings, essence curves, bag point values, troop power per tier) are labelled `estimate`. Replace them through an OTA data pack, or by editing the seed and bumping `SEED_VERSION`.

## Commands

```bash
npm start            # Expo dev server (needs a dev build because of native modules)
npm run verify       # tsc --noEmit + seed validation
npm run build:apk    # eas build -p android --profile preview
```

See `BUILD_APK.md` for building the APK locally.
