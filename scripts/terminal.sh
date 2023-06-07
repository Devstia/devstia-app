#!/bin/bash
#
# This script is executed by the Terminal menu in the system/tray icon.
# It expects two parameters: the password and the port number.
#
password=$1
port=$2
script_path="$(pwd)/terminal_login.sh"

osascript <<EOF
tell application "Terminal"
    activate
    do script "'$script_path' '$password' '$port'"
end tell
EOF
