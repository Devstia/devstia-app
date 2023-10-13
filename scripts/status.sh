#!/bin/bash
#
# This script is executed by the Settings window to obtain
# system server status.
sshPort=$1
private_key="$(pwd)/../security/ssh/debian_rsa"
ssh -q -o StrictHostKeyChecking=no -i "$private_key" -p "$sshPort" debian@local.dev.cc /usr/sbin/service --status-all
