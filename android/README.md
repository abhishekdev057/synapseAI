# Synapse — Android patient app

Native **Kotlin + Jetpack Compose** client for the elderly dementia patient.
Offline-first, with delta sync to `https://synapse.sigmafusion.in`.

Full write-up: [`../docs/PROJECT_OVERVIEW.md`](../docs/PROJECT_OVERVIEW.md) §18.

## Build

```bash
cd android
./gradlew :app:assembleDebug
# APK -> app/build/outputs/apk/debug/app-debug.apk
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Requires JDK 17 and an Android SDK (platform 35, build-tools 35). `local.properties`
is created automatically with `sdk.dir`, or set `ANDROID_HOME`. Opening `android/`
in Android Studio works too.

## Configuration

| What | Where |
|---|---|
| Sync server URL | `DEFAULT_BASE_URL` in `app/build.gradle.kts`; overridable in-app (Settings) |
| Demo patient | `DEMO_PATIENT_NAME` in `app/build.gradle.kts` (used until sign-in exists) |

## Stack

Compose · Material 3 · Room · Retrofit + OkHttp + kotlinx.serialization ·
DataStore · WorkManager · AlarmManager · Android TextToSpeech · hand-rolled DI.
minSdk 26, targetSdk 35.

## Layout

```
com/sigmafusion/synapse/
├── SynapseApp.kt · MainActivity.kt
├── di/            AppContainer (DI graph)
├── core/          TimeUtils
├── domain/        DomainCatalog · AdaptiveDifficulty (port of web lib/adaptive.ts) · models
├── data/
│   ├── local/     Room entities · DAOs · database · SettingsStore (DataStore)
│   ├── remote/    DTOs · SynapseApi (Retrofit) · ApiProvider
│   ├── sync/      SyncWorker · SyncScheduler (WorkManager)
│   └── SynapseRepository.kt   offline-first single source of truth
├── notifications/ ReminderScheduler · ReminderReceiver · BootReceiver
└── ui/
    ├── theme/     Color · Type · Dimens · Theme   (elderly-first design system)
    ├── components/ SectionCard · PrimaryButton · BigTile · StatusPill · SpeakButton …
    ├── voice/     TextToSpeech wrapper
    ├── SynapseNavHost.kt
    └── screens/   home · games (+ MemoryLane) · reminders · people · settings
```
