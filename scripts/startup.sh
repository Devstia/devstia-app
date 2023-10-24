#!/bin/bash
#
# This script is executed by the startup routine in our CodeGarden app.
# Optimized for macOS, we use Haswell-v1 CPU, but build with qemu64-v1
#
sshPort=$1
cpPort=$2
vmsFolder="$3"
samba=$4

# Set DYLD_FALLBACK_LIBRARY_PATH to the lib directory
qemu_path=$(which qemu-system-x86_64)
lib_path=$(dirname "$qemu_path")/../lib
export DYLD_FALLBACK_LIBRARY_PATH="$lib_path"

cd "$vmsFolder" || exit
qemu-system-x86_64 \
        -machine q35,vmport=off -accel hvf \
        -cpu Haswell-v1 \
        -smp cpus=4,sockets=1,cores=4,threads=1 \
        -m 4G \
        -vga virtio \
        -bios bios.img \
        -display default,show-cursor=on \
        -drive if=virtio,format=qcow2,file=pws-amd64.img \
        -device virtio-net-pci,netdev=net0 \
        -netdev user,id=net0,hostfwd=tcp::$sshPort-:22,hostfwd=tcp::80-:80,hostfwd=tcp::443-:443,hostfwd=tcp::$cpPort-:$cpPort$samba \
        -device virtio-balloon-pci \
        -nographic
