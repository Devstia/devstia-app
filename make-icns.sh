#!/bin/bash

#
# Run from app folder to create icns file
#

cd images
mkdir dev_pw.iconset
sips -z 16 16     dev_pw1024.png --out dev_pw.iconset/icon_16x16.png
sips -z 32 32     dev_pw1024.png --out dev_pw.iconset/icon_16x16@2x.png
sips -z 32 32     dev_pw1024.png --out dev_pw.iconset/icon_32x32.png
sips -z 64 64     dev_pw1024.png --out dev_pw.iconset/icon_32x32@2x.png
sips -z 128 128   dev_pw1024.png --out dev_pw.iconset/icon_128x128.png
sips -z 256 256   dev_pw1024.png --out dev_pw.iconset/icon_128x128@2x.png
sips -z 256 256   dev_pw1024.png --out dev_pw.iconset/icon_256x256.png
sips -z 512 512   dev_pw1024.png --out dev_pw.iconset/icon_256x256@2x.png
sips -z 512 512   dev_pw1024.png --out dev_pw.iconset/icon_512x512.png
cp dev_pw1024.png dev_pw.iconset/icon_512x512@2x.png
iconutil -c icns dev_pw.iconset
rm -R dev_pw.iconset


