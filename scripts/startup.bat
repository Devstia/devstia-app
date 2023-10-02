@echo off
REM This script is executed by the startup routine in our CodeGarden app.
set sshPort=%1
set cpPort=%2
set appFolder=%3
set samba=%4

cd /d "%appFolder%\vms" || exit /b
qemu-system-x86_64.exe ^
        -machine q35,vmport=off -accel hvf ^
        -cpu Haswell-v1 ^
        -smp cpus=4,sockets=1,cores=4,threads=1 ^
        -m 4G ^
        -vga virtio ^
        -display default,show-cursor=on ^
        -drive if=pflash,format=raw,file=efi_amd64.img,readonly=on ^
        -drive if=pflash,format=raw,file=efi_amd64_vars.img,readonly=on ^
        -device virtio-net-pci,netdev=net0 ^
        -netdev user,id=net0,hostfwd=tcp::%sshPort%-:22,hostfwd=tcp::80-:80,hostfwd=tcp::443-:443,hostfwd=tcp::%cpPort%-%cpPort%%samba% ^
        -drive if=virtio,format=qcow2,file=pws-amd64.img ^
        -fsdev local,id=virtfs0,path="%appFolder%",security_model=mapped-xattr,fmode=0644,dmode=0755 ^
        -device virtio-9p-pci,fsdev=virtfs0,mount_tag=appFolder ^
        -device virtio-balloon-pci ^
        -nographic
        REM -display default,show-cursor=on
