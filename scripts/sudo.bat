@echo off
:: 
:: Execute the given command as root on the remote vm.
:: 
set sshPort=%1
set password=%2
set command=%3
set private_key=%cd%\..\security\ssh\debian_rsa
ssh -q -o StrictHostKeyChecking=no -i "%private_key%" debian@local.dev.pw -p %sshPort% "echo '%password%' | sudo -S -p '' %command%"
