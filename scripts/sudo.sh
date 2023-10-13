#!/bin/bash
#
# Execute the given command as root on the remote vm.
sshPort=$1
password=$2
command=$3
private_key="$(pwd)/../security/ssh/debian_rsa"
echo "$password" | ssh -q -o StrictHostKeyChecking=no -i "$private_key" debian@local.dev.cc -p "$sshPort" "sudo -S -p '' $command"
