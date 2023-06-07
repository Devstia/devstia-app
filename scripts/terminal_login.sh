#!/usr/bin/expect -f
set password [lindex $argv 0]
set port [lindex $argv 1]
spawn ssh debian@local.dev.cc -p $port
expect -re ".*assword:"
send "$password\r"
expect -re ".*local:"
send "sudo -s su -s /bin/bash pws\r"
send "$password\r"
expect -re ".*local:"
send "cd ~ && cd web && clear\r"
interact