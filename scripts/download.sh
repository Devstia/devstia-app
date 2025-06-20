#!/bin/bash

# Usage: ./download.sh <destination_folder> <url1> <url2> ... <urlN>

set -e

DEST="$1"
shift

if [ -z "$DEST" ] || [ "$#" -lt 1 ]; then
    echo "Usage: $0 <destination_folder> <url1> <url2> ... <urlN>"
    exit 1
fi

mkdir -p "$DEST"
cd "$DEST"

# Download each URL
for url in "$@"; do
    fname=$(basename "$url")
    echo "Downloading $url -> $fname"
    curl -L -o "$fname" "$url"
done

# Combine all downloaded files into a single .tar.xz (sorted by name)
parts=($(ls *.part* 2>/dev/null | sort))
if [ ${#parts[@]} -eq 0 ]; then
    echo "No part files found to combine."
    exit 2
fi

base="${parts[0]}"
base="${base%%.part*}"
tarxz="${base}.tar.xz"
img="${base}.img"

cat "${parts[@]}" > "$tarxz"

# Extract .img file from the .tar.xz
tar -xJf "$tarxz" --wildcards '*.img'

# Clean up: remove part files and .tar.xz
rm -f "${parts[@]}"
rm -f "$tarxz"

# Write done.flag
touch done.flag

echo "Download, extraction, and cleanup complete."