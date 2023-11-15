#!/bin/bash
#
# This script is executed by the startup routine in our Devstia app.
# Optimized for macOS, we use Haswell-v1 CPU, but build with qemu64-v1
#
sshPort=$1
cpPort=$2
vmsFolder="$3"
samba=$4
cd "$vmsFolder" || exit

# Check if the CPU architecture 
cpu_arch=$(sysctl -n machdep.cpu.brand_string)

# For Intel-based Macs
if [[ $cpu_arch == *"Intel"* ]]; then

        # Set DYLD_FALLBACK_LIBRARY_PATH to the lib directory
        qemu_path=$(which qemu-system-x86_64)
        lib_path=$(dirname "$qemu_path")/../lib
        export DYLD_FALLBACK_LIBRARY_PATH="$lib_path"

        qemu-system-x86_64 \
                -machine q35,vmport=off -accel hvf \
                -cpu Haswell-v1 \
                -smp cpus=4,sockets=1,cores=4,threads=1 \
                -m 4G \
                -vga virtio \
                -bios bios.img \
                -display default,show-cursor=on \
                -drive if=virtio,format=qcow2,file=devstia-amd64.img \
                -device virtio-net-pci,netdev=net0 \
                -netdev user,id=net0,hostfwd=tcp::$sshPort-:22,hostfwd=tcp::80-:80,hostfwd=tcp::443-:443,hostfwd=tcp::$cpPort-:$cpPort$samba \
                -device virtio-balloon-pci \
                -nographic
fi

# For Apple Silicon-based Macs
if [[ $cpu_arch == *"Apple M"* ]]; then

        # Set DYLD_FALLBACK_LIBRARY_PATH to the lib directory
        qemu_path=$(which qemu-system-aarch64)
        lib_path=$(dirname "$qemu_path")/../lib
        export DYLD_FALLBACK_LIBRARY_PATH="$lib_path"

        qemu-system-aarch64 \
                -machine virt -accel hvf \
                -cpu host \
                -vga none \
                -smp cpus=4,sockets=1,cores=4,threads=1 \
                -m 4G \
                -drive if=pflash,format=raw,file=efi_arm64.img,file.locking=off,readonly=on \
                -drive if=pflash,format=raw,file=efi_arm64_vars.img \
                -device virtio-blk-pci,drive=drivedevstia-arm64,bootindex=0 \
                -drive if=none,media=disk,id=drivedevstia-arm64,file=devstia-arm64.img,discard=unmap,detect-zeroes=unmap \
                -device virtio-balloon-pci \
                -net nic -net user,hostfwd=tcp::8022-:22,hostfwd=tcp::80-:80,hostfwd=tcp::443-:443,hostfwd=tcp::8083-:8083 \
                -nographic
fi
