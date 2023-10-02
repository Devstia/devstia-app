#!/bin/bash
#
# This script is executed by the Terminal menu in the system/tray icon.
# It expects two parameters: the password and the port number.
#
port=$1
private_key="$(pwd)/../security/ssh/pws_rsa"

if [[ $(uname) == "Darwin" ]]; then
  osascript <<EOF
  tell application "Terminal"
      activate
      
      -- Open a new window and execute SSH command
      set newTab to do script ""
      do script "chmod 600 \"$private_key\" && ssh -q -o StrictHostKeyChecking=no -i \"$private_key\" pws@local.dev.cc -p \"$port\" && exit" in newTab
      repeat while newTab is not missing value
          delay 1
          set custom title of newTab to "CodeGarden\n"
      end repeat
  end tell
EOF
else
  echo "This script is only supported on macOS."
fi