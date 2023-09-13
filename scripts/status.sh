#!/bin/bash
#
# This script is executed by the Settings window to obtain
# system server status.
port=$1
private_key="$(pwd)/../security/ssh/debian_rsa"
chmod 600 "$private_key" && ssh -q -o StrictHostKeyChecking=no -i "$private_key" -p "$port" debian@local.dev.cc /usr/sbin/service --status-all
