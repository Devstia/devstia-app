#!/bin/bash
# 
# This script is executed by the Terminal menu on the system/tray
# icon. It opens a Terminal window and connects to the VM via
# SSH on the given port number.
# 
port=$1
private_key="$(pwd)/../security/ssh/devstia_rsa"

if [[ $(uname) == "Darwin" ]]; then
  osascript <<EOF
  tell application "Terminal"
      activate
      
      -- Open a new window and execute SSH command
      set newTab to do script ""
      do script "chmod 600 \"$private_key\" && ssh -q -o StrictHostKeyChecking=no -i \"$private_key\" devstia@localhost -p \"$port\" && exit" in newTab
      repeat while newTab is not missing value
          delay 1
          set custom title of newTab to "Devstia\n"
      end repeat
  end tell
EOF
else
  echo "This script is only supported on macOS."
fi