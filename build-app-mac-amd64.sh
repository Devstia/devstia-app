#!/bin/bash
#
# Virtuosoft build script for CodeGarden PWS (Personal Web Server) Edition
# on macOS x86 64-bit compatible systems.
#

# assume default qemu is installed (i.e. via cg-pws-vm/build-vm-mac-amd64.sh)
# copy dependencies to runtime folder for macOS
mkdir -p ./runtime/darwin_x64
cd ./runtime/darwin_x64
cp -f /usr/local/Cellar/qemu/8.1.1/bin/qemu-system-x86_64 ./
cp -f /usr/local/Cellar/zstd/1.5.5/lib/libzstd.1.5.5.dylib ./
ln -s ./libzstd.1.5.5.dylib ./libzstd.1.dylib
cp -f /usr/local/Cellar/vde/2.3.3/lib/libvdeplug.3.dylib ./
cp -f /usr/local/Cellar/snappy/1.1.10/lib/libsnappy.1.1.10.dylib ./
ln -s ./libsnappy.1.1.10.dylib ./libsnappy.1.dylib
cp -f /usr/local/Cellar/pixman/0.42.2/lib/libpixman-1.0.42.2.dylib ./
ln -s ./libpixman-1.0.42.2.dylib ./libpixman-1.0.dylib
cp -f /usr/local/Cellar/ncurses/6.4/lib/libncursesw.6.dylib ./
cp -f /usr/local/Cellar/lzo/2.10/lib/liblzo2.2.dylib ./
cp -f /usr/local/Cellar/libusb/1.0.26/lib/libusb-1.0.0.dylib ./
cp -f /usr/local/Cellar/libssh/0.10.5_1/lib/libssh.4.9.5.dylib ./
ln -s ./libssh.4.9.5.dylib ./libssh.4.dylib
cp -f /usr/local/Cellar/openssl@3/3.1.3/lib/libcrypto.3.dylib ./
cp -f /usr/local/Cellar/libslirp/4.7.0/lib/libslirp.0.dylib ./
cp -f /usr/local/Cellar/pcre2/10.42/lib/libpcre2-8.0.dylib ./
cp -f /usr/local/Cellar/libpng/1.6.40/lib/libpng16.16.dylib ./
cp -f /usr/local/Cellar/jpeg-turbo/3.0.0/lib/libjpeg.8.3.2.dylib ./
ln -s ./libjpeg.8.3.2.dylib ./libjpeg.8.dylib
cp -f /usr/local/Cellar/gnutls/3.8.1/lib/libgnutls.30.dylib ./
cp -f /usr/local/Cellar/gmp/6.2.1_1/lib/libgmp.10.dylib ./
cp -f /usr/local/Cellar/libunistring/1.1/lib/libunistring.5.dylib ./
cp -f /usr/local/Cellar/glib/2.78.0/lib/libgobject-2.0.0.dylib ./
cp -f /usr/local/Cellar/pcre2/10.42/lib/libpcre2-8.0.dylib ./
cp -f /usr/local/Cellar/glib/2.78.0/lib/libgmodule-2.0.0.dylib ./
cp -f /usr/local/Cellar/pcre2/10.42/lib/libpcre2-8.0.dylib ./
cp -f /usr/local/Cellar/glib/2.78.0/lib/libglib-2.0.0.dylib ./
cp -f /usr/local/Cellar/pcre2/10.42/lib/libpcre2-8.0.dylib ./
cp -f /usr/local/Cellar/glib/2.78.0/lib/libgio-2.0.0.dylib ./
cp -f /usr/local/Cellar/pcre2/10.42/lib/libpcre2-8.0.dylib ./
cp -f /usr/local/Cellar/pcre2/10.42/lib/libpcre2-8.0.dylib ./
cp -f /usr/local/Cellar/pcre2/10.42/lib/libpcre2-8.0.dylib ./
cp -f /usr/local/Cellar/dtc/1.7.0/lib/libfdt-1.7.0.dylib ./
ln -s ./libfdt-1.7.0.dylib ./libfdt.1.dylib
cp -f /usr/local/Cellar/capstone/5.0.1/lib/libcapstone.5.dylib ./
cp -f /usr/local/Cellar/gettext/0.22.3/lib/libintl.8.dylib ./
cp -f /usr/local/Cellar/p11-kit/0.25.0/lib/libp11-kit.0.dylib ./
cp -f /usr/local/Cellar/libidn2/2.3.4_1/lib/libidn2.0.dylib ./
cp -f /usr/local/Cellar/libtasn1/4.19.0/lib/libtasn1.6.dylib ./
cp -f /usr/local/Cellar/nettle/3.9.1/lib/libnettle.8.8.dylib ./
ln -s ./libnettle.8.8.dylib ./libnettle.8.dylib
cp -f /usr/local/Cellar/nettle/3.9.1/lib/libhogweed.6.8.dylib ./
ln -s ./libhogweed.6.8.dylib ./libhogweed.6.dylib

mkdir -p ./share/qemu
cp -f /usr/local/Cellar/qemu/8.1.1/share/qemu/kvmvapic.bin ./share/qemu/
cp -f /usr/local/Cellar/qemu/8.1.1/share/qemu/vgabios-virtio.bin ./share/qemu/
cp -f /usr/local/Cellar/qemu/8.1.1/share/qemu/efi-virtio.rom ./share/qemu/
