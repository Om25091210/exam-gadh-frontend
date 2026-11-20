# ExamGadh phone app (React Native + Expo)

Android student app. Hindi/English, light indigo theme, screenshots and screen recording blocked while signed in.
It talks to the same API as the website and shares the typed API client, the Hindi/English dictionaries and the
exam logic (timer, autosave, question palette) with the web app (see `metro.config.js`).

## Install on your phone fast (USB cable, developer mode on)
Google sign-in uses a native library, so Expo Go cannot run the app: use one of these.

**A. Build on your computer and install over USB (fastest after the first build).** Needs Android Studio (for the Android SDK)
and Java 17, and `adb devices` must list your phone.
```bash
cd mobile
npm install --legacy-peer-deps
npx expo run:android --device          # builds, installs and opens the app on the connected phone
```
After the first build, JavaScript changes appear instantly with `npx expo start --dev-client` (no rebuild).

**B. Cloud build, then install straight onto the phone (no Android Studio).** The cloud build itself is what takes long
(a free Expo account queues builds); installing is one command:
```bash
eas build -p android --profile preview        # once; wait for it to finish
eas build:run -p android --latest             # downloads the latest build and installs it on the connected phone
```

## Google sign-in on Android (read this if the button says "did not work")
The app uses the native Google account picker. It only needs the **web** client id (already built in). Google recognises the
app by its **package name `com.examgadh.app` + the SHA-1 of the key that signed the build**, so each way of building needs its
SHA-1 registered once in Google Cloud Console > APIs & Services > Credentials > Create credentials > OAuth client ID > Android
(package `com.examgadh.app`):
- Cloud build (`eas build`): run `eas credentials -p android` and copy the SHA-1 fingerprint of the keystore.
- Local build (`expo run:android`): `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android` (Windows: `%USERPROFILE%\.android\debug.keystore`).
- Play Store: the SHA-1 shown under Play Console > App integrity > App signing.
Several Android clients (one per SHA-1) can exist side by side. Changes can take a few minutes to apply.

## What is in the app
Home (streak, stats, live/continue, Explore tiles, daily quiz, series), Tests (filters, detail, exam player with
server-authoritative timer + offline-safe autosave + palette, result with rank/percentile, answer review),
Learn (Notes you can read and like, Current affairs, Previous year papers, PDFs/videos, Interview prep),
Leaderboard (podium), Profile (language, plan, privacy), Notifications.
Not yet in the app: payments (Razorpay), doubts desk, study planner, 1-v-1 battle (needs the realtime service).
