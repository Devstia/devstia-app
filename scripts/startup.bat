@echo off
REM This script is executed by the startup routine in our CodeGarden app.
set sshPort=%1
set cpPort=%2
set appFolder=%3
set samba=%4
cd /d "%appFolder%\vms" || exit /b
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
        REM sudo mount -t 9p -o trans=virtio,version=9p2000.L,access=any,msize=65536 shared /mnt/shared
        REM -virtfs local,path=C:\tmp,mount_tag=foo,security_model=mapped-xattr
        REM -netdev user,id=net0,hostfwd=tcp::%sshPort%-:22,hostfwd=tcp::80-:80,hostfwd=tcp::443-:443,hostfwd=tcp::%cpPort%-%cpPort%%samba%
        REM -drive if=pflash,format=raw,file=efi_amd64.img,readonly=on ^
        REM -drive if=pflash,format=raw,file=efi_amd64_vars.img,readonly=on ^
        REM -device virtio-net-pci,netdev=net0 ^
        REM -netdev user,id=net0,hostfwd=tcp::%sshPort%-:22,hostfwd=tcp::80-:80,hostfwd=tcp::443-:443,hostfwd=tcp::%cpPort%-%cpPort%%samba% ^
        REM -fsdev local,id=virtfs0,path="%appFolder%",security_model=mapped-xattr,fmode=0644,dmode=0755 ^
        REM -device virtio-9p-2000,fsdev=virtfs0,mount_tag=appFolder ^
        REM -nographic
        REM -display default,show-cursor=on
