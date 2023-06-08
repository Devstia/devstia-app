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
    
    -- Open a new window and execute SSH command
    set newTab to do script "clear && sshpass -p '$password' ssh -o StrictHostKeyChecking=no -t -p $port debian@dev.cc"
    
end tell
EOF
