#!/bin/bash
#
# Virtuosoft build script for Devstia Preview (a localhost development server)
# on macOS Apple Silicon compatible systems.
#

# Required for notarization and code-signing
# export APPLE_USER="steve@steveorevo.com"
# export APPLE_PW="0123-4567-89AB-CDEF"
# export APPLE_DEV_ID="ABCDE12345"

# Check for qemu installation (installed from https://github.com/virtuosoft-dev/devstia-vm)
qemu_path=$(which qemu-system-aarch64)
qemu_img_path=$(which qemu-img)

if [ -z "$qemu_path" ]; then
  echo 'Error: qemu-system-aarch64 is not installed.' >&2
  exit 1
fi

# Get NodeJS dependencies
npm install

# Get list of dependencies of qemu-system-aarch64
output=$(otool -L "$qemu_path")

# Convert the output into an array
arr=()
while IFS= read -r line; do
    line=$(echo "$line" | awk -F '(' '{print $1}' | awk '{$1=$1};1')
    if [[ $line == *"/homebrew/"* ]] && [[ $line != *"qemu-system-aarch64:" ]]; then
        arr+=("$line")
    fi
done <<< "$output"

# Remove existing runtime/darwin_arm64 folder
rm -rf ./runtime/darwin_arm64

# Create the runtime/darwin_arm64 folder if it does not exist
mkdir -p ./runtime/darwin_arm64/bin
mkdir -p ./runtime/darwin_arm64/lib
mkdir -p ./runtime/darwin_arm64/share/qemu

# Copy qemu-system-aarch64, qemu-img to runtime folder for macOS
cp -f "$qemu_path" ./runtime/darwin_arm64/bin/
cp -f "$qemu_img_path" ./runtime/darwin_arm64/bin/

# Copy each dependency to runtime folder for macOS
for i in "${arr[@]}"; do

    cp -f "$i" ./runtime/darwin_arm64/lib/

    # Get list of dependencies for each lib dependency
    output2=$(otool -L "$i")

    # Convert the output into an array
    arr2=()
    while IFS= read -r line; do

        line=$(echo "$line" | awk -F '(' '{print $1}' | awk '{$1=$1};1')
        if [[ $line == *"/opt/"* ]] && [[ $line != *":" ]]; then
            arr2+=("$line")
        fi
    done <<< "$output2"

    # Copy each lib dependency to runtime folder for macOS
    for j in "${arr2[@]}"; do
        if [[ $j != *"/opt/homebrew/"* ]]; then
            j=/opt/homebrew/opt/${j#*/opt/}
        fi
        cp -f "$j" ./runtime/darwin_arm64/lib/
    done
done

# Find share dependencies, and copy them over too
qemu_folder=$(dirname "$(dirname "$qemu_path")")/Cellar/qemu
kvmvapic_path=$(find "$qemu_folder" -name kvmvapic.bin)
vgabios_virtio_path=$(find "$qemu_folder" -name vgabios-virtio.bin)
efi_virtio_path=$(find "$qemu_folder" -name efi-virtio.rom)
cp -f "$kvmvapic_path" ./runtime/darwin_arm64/share/qemu/
cp -f "$vgabios_virtio_path" ./runtime/darwin_arm64/share/qemu/
cp -f "$efi_virtio_path" ./runtime/darwin_arm64/share/qemu/

# Package the application
npm run package

# Remove build scripts from the package to omit developer credentials
rm -rf out/Devstia-darwin-arm64/Devstia.app/Contents/Resources/app/build-*

# Sign and notarize the application manually
# (Note: This is a temporary workaround until electron-builder supports Apple Silicon)
# (Note: You will need to replace the APPLE_DEV_ID, APPLE_USER, and APPLE_PW variables with your own)
codesign --entitlements ./entitlements/qemu.plist --force --options runtime --timestamp --sign "$APPLE_DEV_ID" out/Devstia-darwin-arm64/Devstia.app/Contents/Resources/app/runtime/darwin_arm64/bin/qemu-system-aarch64
codesign --entitlements ./entitlements/qemu.plist --force --options runtime --timestamp --sign "$APPLE_DEV_ID" out/Devstia-darwin-arm64/Devstia.app/Contents/Resources/app/runtime/darwin_arm64/bin/qemu-img
codesign --entitlements ./entitlements/devstia.plist --force --options runtime --timestamp --sign "$APPLE_DEV_ID" out/Devstia-darwin-arm64/Devstia.app/Contents/Frameworks/Squirrel.framework/Versions/A/Resources/ShipIt
find out/Devstia-darwin-arm64/Devstia.app/Contents/Resources/app/runtime/darwin_arm64/lib/ -name '*.dylib' -exec codesign --entitlements ./entitlements/devstia.plist --force --options runtime --timestamp --sign "$APPLE_DEV_ID" {} \;
find "out/Devstia-darwin-arm64/Devstia.app/Contents/Frameworks/Electron Framework.framework/" -name '*.dylib' -exec codesign --entitlements ./entitlements/devstia.plist --force --options runtime --timestamp --sign "$APPLE_DEV_ID" {} \;
codesign --entitlements ./entitlements/devstia.plist --deep --options runtime --force --verbose --sign "$APPLE_DEV_ID" out/Devstia-darwin-arm64/Devstia.app
ditto -c -k --keepParent out/Devstia-darwin-arm64/Devstia.app out/Devstia-darwin-arm64/Devstia-Apple-Silicon.zip
xcrun notarytool store-credentials "$APPLE_USER" --team-id="$APPLE_DEV_ID" --apple-id "$APPLE_USER" --password "$APPLE_PW"
xcrun notarytool submit 'out/Devstia-darwin-arm64/Devstia-Apple-Silicon.zip' --keychain-profile "$APPLE_USER" --apple-id "$APPLE_USER" --password "$APPLE_PW" --wait
