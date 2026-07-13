#!/usr/bin/env bash
# Build a Release build and install it on a USB-connected iPhone.
#
# `expo run:ios` can't be used here: it passes COCOAPODS_PARALLEL_CODE_SIGN=true,
# which makes the Pods embed script codesign all 8 frameworks concurrently. The
# concurrent keychain access makes most of those codesign calls fail with
# errSecInternalComponent. They run as background jobs, so the failures are
# swallowed and the build still reports success — but the frameworks ship
# unsigned and the device rejects the app with ApplicationVerificationFailed.
# Invoking xcodebuild without that flag signs sequentially, which succeeds.
set -euo pipefail

cd "$(dirname "$0")/.."

DEVICES=$(mktemp).json
xcrun devicectl list devices --json-output "$DEVICES" >/dev/null 2>&1
UDID=$(python3 -c "
import json
devices = json.load(open('$DEVICES'))['result']['devices']
print(next((d['hardwareProperties']['udid'] for d in devices), ''))
")
rm -f "$DEVICES"
if [ -z "$UDID" ]; then
  echo "No iPhone found. Connect it over USB, unlock it, and trust this Mac." >&2
  exit 1
fi

DERIVED=ios/build/derived

xcodebuild \
  -workspace ios/tsumiki.xcworkspace \
  -scheme tsumiki \
  -configuration Release \
  -destination "id=$UDID" \
  -derivedDataPath "$DERIVED" \
  -allowProvisioningUpdates \
  COMPILER_INDEX_STORE_ENABLE=NO

xcrun devicectl device install app --device "$UDID" \
  "$DERIVED/Build/Products/Release-iphoneos/tsumiki.app"
