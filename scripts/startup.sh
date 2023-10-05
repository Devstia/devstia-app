#!/bin/bash
#
# This script is executed by the startup routine in our CodeGarden app.
#
sshPort=$1
cpPort=$2
appFolder="$3"
samba=$4

cd "$appFolder/vms" || exit
qemu-system-x86_64 \
        -machine q35,vmport=off -accel hvf \
        -cpu qemu64-v1 \
        -smp cpus=4,sockets=1,cores=4,threads=1 \
        -m 4G \
        -vga virtio \
        -bios bios.img \
        -display default,show-cursor=on \
        -device virtio-net-pci,netdev=net0 \
        -netdev user,id=net0,hostfwd=tcp::"$sshPort"-:22,hostfwd=tcp::80-:80,hostfwd=tcp::443-:443,hostfwd=tcp::"$cpPort"-:"$cpPort"$samba \
        -drive if=virtio,format=qcow2,file=pws-amd64.img \
        -fsdev local,id=virtfs0,path="$appFolder",security_model=mapped-xattr,fmode=0644,dmode=0755 \
        -device virtio-9p-pci,fsdev=virtfs0,mount_tag=appFolder \
        -device virtio-balloon-pci \
        -nographic
        # -drive if=pflash,format=raw,file=efi_amd64.img,readonly=on \
        # -drive if=pflash,format=raw,file=efi_amd64_vars.img,readonly=on \
        #-display default,show-cursor=on