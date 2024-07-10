::
:: This script is used as a proxy for qemu-img
::

set vmsFilePath=%1
set outputFilePath=%2

qemu-img convert -O qcow2 "%vmsFilePath%" "%outputFilePath%"
