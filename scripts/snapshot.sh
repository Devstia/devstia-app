#!/bin/bash
#
# This script is used as a proxy for qemu-img, setting the library path correctly for macOS.
#

vmsFilePath=$1
outputFilePath=$2

# Set DYLD_FALLBACK_LIBRARY_PATH to the lib directory
qemu_img_path=$(which qemu-img)
lib_path=$(dirname "$qemu_img_path")/../lib
export DYLD_FALLBACK_LIBRARY_PATH="$lib_path"

qemu-img convert -O qcow2 -c "$vmsFilePath" "$outputFilePath"
