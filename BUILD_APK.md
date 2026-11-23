# Building the Frozen Codex APK

Expo SDK 58 · React Native 0.88 · New Architecture. Requires Node 20+.

```bash
npm install
npm run verify        # TypeScript strict check + seed/SQLite/calculator validation
```

## Option A — one-command cloud APK (EAS)

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

The `preview` profile in `eas.json` sets `"buildType": "apk"`, so EAS returns a directly installable `.apk` link (no Play Store needed). `--profile apk` is an alias.

## Option B — local Gradle build

Needs Android Studio (SDK 35+, NDK installed by Gradle) and JDK 17.

```bash
npx expo prebuild --platform android --clean
cd android && ./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`.

The prebuild template signs release builds with the debug keystore, which is fine for sideloading. For a distributable build, create a keystore and wire it into `android/app/build.gradle` (`signingConfigs.release`) before running `assembleRelease`.

Install on a connected phone:

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

## Database update packs (no reinstall)

```bash
npm run export:seed -- 2   # writes data-pack/manifest.json with version 2
```

Host `data-pack/manifest.json` on GitHub Pages or a raw GitHub URL, set that URL in **Guides › Settings › Database updates** (or `expo.extra.dataManifestUrl` in `app.json`), and tap **Check for updates**. Rows from the pack are merged into SQLite by id and are kept when a newer APK re-seeds the bundled data.

## Versions and releases (GitHub Actions)

Every push to `main` builds the APK and publishes a GitHub release automatically. The version is the latest release's version plus one patch step (v1.0.3 → v1.0.4 → v1.0.5 …). The workflow writes that version into `app.json` during the build (it is not committed), so the app's Settings screen and Android's update check both see the new number. To jump to a new minor or major version, publish a release tagged e.g. `v1.1.0` by hand; the next build becomes `v1.1.1`.
