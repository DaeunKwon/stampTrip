#!/usr/bin/env bash
# 원스토어 업로드용 서명된 release APK 빌드
# 사전 조건: android/keystore.properties + android/keystore/stamptrip-release.jks (gitignore, 별도 백업)
#           JDK 17~21 (Android Studio 내장 JDK 25 는 Gradle 8.14 가 지원하지 않음)
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -z "${JAVA_HOME:-}" ] || ! "$JAVA_HOME/bin/java" -version 2>&1 | grep -qE 'version "(17|21)'; then
  CANDIDATE=$(ls -d "$HOME"/.jdks/jdk-21*/Contents/Home 2>/dev/null | tail -1 || true)
  if [ -z "$CANDIDATE" ]; then
    echo "JDK 21 이 필요합니다. 예) mkdir -p ~/.jdks && cd ~/.jdks && curl -sL -o jdk.tgz 'https://api.adoptium.net/v3/binary/latest/21/ga/mac/aarch64/jdk/hotspot/normal/eclipse' && tar xzf jdk.tgz" >&2
    exit 1
  fi
  export JAVA_HOME="$CANDIDATE"
fi
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"

[ -f android/keystore.properties ] || { echo "android/keystore.properties 가 없습니다 (서명 키 설정 필요)" >&2; exit 1; }

npm run build
npx cap sync android
(cd android && ./gradlew assembleRelease --no-daemon -q)

mkdir -p android/app/release
VERSION=$(grep -E '^\s*versionName' android/app/build.gradle | sed -E 's/.*"([^"]+)".*/\1/')
OUT="android/app/release/stamptrip-${VERSION}-release.apk"
cp android/app/build/outputs/apk/release/app-release.apk "$OUT"
echo "✔ $OUT"
