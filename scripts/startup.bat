@echo off
REM This script is executed by the startup routine in our CodeGarden app.
set sshPort=%1
set cpPort=%2
set vmsFolder=%3
set samba=%4
cd /d "%vmsFolder%" || exit /b
qemu-system-x86_64 ^
        -machine q35,vmport=off -accel whpx,kernel-irqchip=off ^
        -cpu qemu64-v1 ^
        -smp cpus=4,sockets=1,cores=4,threads=1 ^
        -m 4G ^
        -vga virtio ^
        -bios bios.img ^
        -display default,show-cursor=on ^
        -drive if=virtio,format=qcow2,file=pws-amd64.img ^
        -net nic -net user,hostfwd=tcp::%sshPort%-:22,hostfwd=tcp::80-:80,hostfwd=tcp::443-:443,hostfwd=tcp::%cpPort%-:%cpPort%%samba% ^
        -device virtio-balloon-pci ^
        -nographic
