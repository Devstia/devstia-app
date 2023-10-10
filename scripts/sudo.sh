#!/bin/bash
#
# Execute the given command as root on the remote vm.
sshPort=$1
password=$2
command=$3
private_key="$(pwd)/../security/ssh/debian_rsa"
cache_key="$(pwd)/../cache_key"

# Check if keys synched, copy to cache
if [ -f "$private_key" ]; then
    cp "$private_key" "$cache_key"
    chmod 600 "$cache_key"
fi
if [ -f "$cache_key" ]; then   
    echo "$password" | ssh -q -o StrictHostKeyChecking=no -i "$cache_key" debian@local.dev.cc -p "$sshPort" "sudo -S -p '' $command"
else
    echo "No cache key found for sudo"
    exit 1
fi
