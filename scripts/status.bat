@echo off
:: 
:: This script is executed by the Settings window to obtain
:: system server status.
:: 
set sshPort=%1
set private_key=%cd%\..\security\ssh\debian_rsa
ssh -q -o StrictHostKeyChecking=no -i "%private_key%" debian@local.dev.cc -p %sshPort% "/usr/sbin/service --status-all"
