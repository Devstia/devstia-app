#!/bin/bash

# Check if the CPU architecture indicates an Intel-based Mac
cpu_arch=$(sysctl -n machdep.cpu.brand_string)
if [[ $cpu_arch == *"Intel"* ]]; then
    echo "This is an Intel-based Mac."
else
    echo "This script is only compatible with Intel-based Macs. Exiting..."
    exit 1
fi

# Check if qemu is installed
qemu_path=$(which qemu-system-x86_64)
qemu_img_path=$(which qemu-img)
if [ -z "$qemu_path" ]; then
    echo "qemu is not installed. Please install qemu to run this script."
    exit 1
fi

# Get NodeJS dependencies
npm install

# Get list of dependencies of qemu-system-x86_64
output=$(otool -L "$qemu_path")

# Convert the output into an array
arr=()
while IFS= read -r line; do
    line=$(echo "$line" | awk -F '(' '{print $1}' | awk '{$1=$1};1')
    if [[ $line == *"/opt/"* ]]; then
        arr+=("$line")
    fi
done <<< "$output"

# Remove existing runtime/darwin_x64 folder
rm -rf ./runtime/darwin_x64

# Create the runtime/darwin_x64 folder if it does not exist
mkdir -p ./runtime/darwin_x64/bin
mkdir -p ./runtime/darwin_x64/lib
mkdir -p ./runtime/darwin_x64/share/qemu

# Copy qemu-system-x86_64, qemu-img to runtime folder for macOS
cp -f "$qemu_path" ./runtime/darwin_x64/bin/
cp -f "$qemu_img_path" ./runtime/darwin_x64/bin/

# Copy each dependency to runtime folder for macOS
for i in "${arr[@]}"; do

    cp -f "$i" ./runtime/darwin_x64/lib/
    echo "$i"

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
        j=/usr/local/opt/${j#*/opt/}
        cp -f "$j" ./runtime/darwin_x64/lib/
        echo "$j"
    done
done

# Find share dependencies, and copy them over too
qemu_folder=$(dirname "$(dirname "$qemu_path")")/Cellar/qemu
kvmvapic_path=$(find "$qemu_folder" -name kvmvapic.bin)
vgabios_virtio_path=$(find "$qemu_folder" -name vgabios-virtio.bin)
efi_virtio_path=$(find "$qemu_folder" -name efi-virtio.rom)
cp -f "$kvmvapic_path" ./runtime/darwin_x64/share/qemu/
cp -f "$vgabios_virtio_path" ./runtime/darwin_x64/share/qemu/
cp -f "$efi_virtio_path" ./runtime/darwin_x64/share/qemu/


# Exit immediately if a command exits with a non-zero status.
set -e
chmod +x ./node_modules/systray2/traybin/tray_darwin_release

# --- Configuration ---
APP_NAME="Devstia"
APP_VERSION=$(node -p "require('./package.json').version")
APP_IDENTIFIER="com.virtuosoft.devstia"
NODE_VERSION="v20.9.0"
NODE_ARCH="x64"
BUILD_DIR="build"
DIST_DIR="${BUILD_DIR}/dist/mac_${NODE_ARCH}"
APP_BUNDLE_NAME="${APP_NAME}.app"
APP_BUNDLE_PATH="${DIST_DIR}/${APP_BUNDLE_NAME}"
NODE_DIST_URL="https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-darwin-${NODE_ARCH}.tar.gz"
NODE_DOWNLOAD_PATH="${BUILD_DIR}/node-download-${NODE_ARCH}.tar.gz" # Arch-specific download name
NODE_EXTRACT_PATH="${BUILD_DIR}/node-extracted-${NODE_ARCH}" # Arch-specific extract path
NODE_BIN_PATH="${NODE_EXTRACT_PATH}/node-${NODE_VERSION}-darwin-${NODE_ARCH}/bin/node"
ICON_SOURCE_PATH="images/icon.icns"
ICON_FINAL_NAME="AppIcon.icns"

# --- Cleanup and Setup ---
echo "Cleaning up previous build (if any)..."
rm -rf "${APP_BUNDLE_PATH}"
mkdir -p "${BUILD_DIR}"
mkdir -p "${DIST_DIR}"
mkdir -p "${APP_BUNDLE_PATH}/Contents/MacOS"
mkdir -p "${APP_BUNDLE_PATH}/Contents/Resources"

echo "Build directory structure created."

# --- Download Node.js ---
# Check if already downloaded
if [ -f "${NODE_DOWNLOAD_PATH}" ]; then
    echo "Node.js ${NODE_VERSION} for darwin-${NODE_ARCH} already downloaded."
else
    echo "Node.js ${NODE_VERSION} for darwin-${NODE_ARCH} not found. Downloading..."
    echo "Downloading Node.js ${NODE_VERSION} for darwin-${NODE_ARCH}..."
    curl -L "${NODE_DIST_URL}" -o "${NODE_DOWNLOAD_PATH}"
    echo "Extracting Node.js..."
    mkdir -p "${NODE_EXTRACT_PATH}"
    tar -xzf "${NODE_DOWNLOAD_PATH}" -C "${NODE_EXTRACT_PATH}"
    if [ ! -f "${NODE_BIN_PATH}" ]; then
        echo "Error: Node binary not found at ${NODE_BIN_PATH}"
        exit 1
    fi
    echo "Node.js downloaded and extracted."
fi

# --- Copy Application Files ---
echo "Copying application folders (src, node_modules, images) and package.json..."
APP_RESOURCES_DIR="${APP_BUNDLE_PATH}/Contents/Resources/app"
mkdir -p "${APP_RESOURCES_DIR}"
rsync -av --progress \
    --exclude '.git' \
    --exclude 'build' \
    --exclude '*.sh' \
    --exclude '.DS_Store' \
    --exclude 'launcher' \
    src runtime node_modules images document_errors web package.json \
    "${APP_RESOURCES_DIR}/"

# --- Copy Node.js Runtime ---
echo "Copying Node.js runtime..."
cp "${NODE_BIN_PATH}" "${APP_BUNDLE_PATH}/Contents/Resources/app/runtime/darwin_x64/bin/node"

# --- Create Launcher Script ---
echo "Creating launcher script..."
LAUNCHER_SCRIPT_PATH="${APP_BUNDLE_PATH}/Contents/MacOS/${APP_NAME}"
cat > "${LAUNCHER_SCRIPT_PATH}" << EOF
#!/bin/bash
DIR=\$(cd "\$(dirname "\$0")" && pwd)
RESOURCES_DIR="\$DIR/../Resources"
cd "\$RESOURCES_DIR/app" || exit 1
"\$RESOURCES_DIR/app/runtime/darwin_x64/bin/node" src/main.js "\$@"
EOF
chmod +x "${LAUNCHER_SCRIPT_PATH}"
echo "Launcher script created and made executable."

# --- Copy Icon ---
echo "Copying .icns file..."
if [ ! -f "${ICON_SOURCE_PATH}" ]; then
    echo "Error: Icon source file not found at ${ICON_SOURCE_PATH}. Cannot copy icon."
    exit 1
else
    cp "${ICON_SOURCE_PATH}" "${APP_BUNDLE_PATH}/Contents/Resources/${ICON_FINAL_NAME}"
    echo ".icns file copied to ${APP_BUNDLE_PATH}/Contents/Resources/${ICON_FINAL_NAME}"
fi

# --- Create Info.plist ---
echo "Creating Info.plist..."
INFO_PLIST_PATH="${APP_BUNDLE_PATH}/Contents/Info.plist"
cat > "${INFO_PLIST_PATH}" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>${APP_NAME}</string>
    <key>CFBundleIconFile</key>
    <string>${ICON_FINAL_NAME}</string>
    <key>CFBundleIdentifier</key>
    <string>${APP_IDENTIFIER}</string>
    <key>CFBundleName</key>
    <string>${APP_NAME}</string>
    <key>CFBundleVersion</key>
    <string>${APP_VERSION}</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>${APP_VERSION}</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.13.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSHumanReadableCopyright</key>
    <string>Copyright © $(date +%Y) Virtuosoft. All rights reserved.</string>
    <key>LSUIElement</key>
    <true/>
</dict>
</plist>
EOF
echo "Info.plist created."

echo "Build complete: ${APP_BUNDLE_PATH}"