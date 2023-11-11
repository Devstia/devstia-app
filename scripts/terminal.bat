@echo off
:: 
:: This script is executed by the Terminal menu on the system/tray
:: icon. It opens a Terminal window and connects to the VM via
:: SSH on the given port number.
::
title Devstia
set port=%1
set private_key=%cd%\..\security\ssh\devstia_rsa
ssh -q -o StrictHostKeyChecking=no -i "%private_key%" devstia@localhost -p %port% && exit
