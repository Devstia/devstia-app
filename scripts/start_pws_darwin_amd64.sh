#!/bin/bash
cd "$PWS_APP_DATA" || exit
qemu-system-x86_64 \
    -smp 3 \
    -m 4096 \
    -drive if=virtio,format=qcow2,file=pws-amd64.img \
    -device virtio-net-pci,netdev=net0 \
    -netdev user,id=net0,hostfwd=tcp::8022-:22,hostfwd=tcp::80-:80,hostfwd=tcp::443-:443,hostfwd=tcp::8083-:8083 \
    -bios bios_amd.img \
    -boot d \
    -accel hvf \
    -cpu host

