#!/bin/bash
#
# This script is executed by the Settings window to obtain
# system server status.
private_key="$(pwd)/../security/ssh/debian_rsa"

if test -f "$private_key"; then
    chmod 600 "$private_key" && ssh -q -o StrictHostKeyChecking=no -i "$private_key" -p "$port" debian@local.dev.cc /usr/sbin/service --status-all
else
    echo "debian_rsa file not found/ready, exiting..."
    exit 1
fi