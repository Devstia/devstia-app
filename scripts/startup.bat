@echo off
:: 
:: This script is executed by the startup routine in our Devstia app.
:: Optimized for Windows 10 with Hyper-V
:: 
set vmsMemory=%1
set vmsCPUs=%2
set sshPort=%3
set cpPort=%4
set vmsFolder=%5
set samba=%6
cd /d "%vmsFolder%" || exit /b
qemu-system-x86_64 ^
        -machine q35,vmport=off -accel whpx,kernel-irqchip=off ^
        -cpu qemu64-v1 ^
        -smp cpus=%vmsCPUs%,sockets=1,cores=%vmsCPUs%,threads=1 ^
        -m %vmsMemory% ^
        -vga virtio ^
        -bios bios.img ^
        -display default,show-cursor=on ^
        -drive if=virtio,format=qcow2,file=devstia-amd64.img ^
        -net nic -net user,hostfwd=tcp::%sshPort%-:22,hostfwd=tcp::80-:80,hostfwd=tcp::443-:443,hostfwd=tcp::%cpPort%-:%cpPort%%samba% ^
        -device virtio-balloon-pci ^
        -nographic
