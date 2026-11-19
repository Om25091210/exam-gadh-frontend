# ExamGadh phone app (React Native + Expo)

Android student app. Hindi/English, light indigo theme, screenshots and screen recording blocked while signed in.
It talks to the same API as the website and shares the typed API client, the Hindi/English dictionaries and the
exam logic (timer, autosave, question palette) with the web app (see `metro.config.js`).

## Run it on your phone (development)
```bash
cd mobile
npm install --legacy-peer-deps
cp .env.example .env        # API url + Google client ids
npx expo start              # scan the QR code with Expo Go (or press "a" for an emulator)
```
`EXPO_PUBLIC_DEV_LOGIN=1` shows a "Developer sign-in" button (works only against an API started with `GOOGLE_VERIFIER=dev`).

## Build an installable APK (needs a free Expo account, nothing else)
```bash
npm i -g eas-cli
eas login
eas build -p android --profile preview      # APK you can install and share
eas build -p android --profile production   # AAB for the Play Store
```

## Google sign-in on Android
Google sign-in needs an **Android OAuth client** in Google Cloud Console (APIs & Services > Credentials):
type Android, package name `com.examgadh.app`, and the SHA-1 of your signing key (`eas credentials` shows it).
Put its client id in `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`. The existing web client id goes in `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.

## What is in the app
Home (streak, stats, live/continue, Explore tiles, daily quiz, series), Tests (filters, detail, exam player with
server-authoritative timer + offline-safe autosave + palette, result with rank/percentile, answer review),
Learn (Notes you can read and like, Current affairs, Previous year papers, PDFs/videos, Interview prep),
Leaderboard (podium), Profile (language, plan, privacy), Notifications.
Not yet in the app: payments (Razorpay), doubts desk, study planner, 1-v-1 battle (needs the realtime service).
