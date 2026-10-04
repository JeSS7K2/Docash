# Docash

**English** · [Español](README.es.md)

Personal finance app for Android. Everything stays on the phone: no account, no login, no server. Open it, log your stuff, close it.

## What it does

- Log expenses and income with its own number pad, category, note and date.
- Total balance plus this month's income and expenses on the home screen.
- Transaction list with day/week/month/year/all filters and a search box.
- Categories with icons; add your own when something's missing.
- Per-category budgets (daily, weekly or monthly) with a progress bar and an alert when you go over.
- Savings goals with progress. The deadline is optional; skip it and it's open-ended.
- Recurring entries: daily, weekly, monthly, or every N days/weeks/months. They get applied on their own when you open the app.
- USD or EUR. It only changes the symbol, it won't convert amounts you already saved (on purpose).
- Light, dark or system theme, and the whole app in English and Spanish.
- PIN and fingerprint lock.
- Reminders for budgets, goals and inactivity, each with a switch to turn it off.
- Export and import your data as text, to back it up or move it to another phone.
- Home-screen widget with the balance.

## Stack

React Native 0.76 on the new architecture, WatermelonDB (on-device SQLite, via JSI), Skia for charts, Reanimated + Gesture Handler for transitions, Gluestack for components and Zustand for state. Nothing leaves the device.

## Running it

You'll need Node, JDK 17 and the Android SDK with `ANDROID_HOME` and `JAVA_HOME` set.

```bash
npm install
npm start          # start Metro
npm run android    # build and install on an emulator or device
```

For a release APK (arm64-v8a only by default):

```bash
cd android
./gradlew assembleRelease
```

The APK ends up in `android/app/build/outputs/apk/release/`.

## Tests

Logic runs on Jest:

```bash
npm test
```

UI flows run on [Maestro](https://maestro.mobile.dev/), in `maestro/`:

```bash
maestro test maestro
```
