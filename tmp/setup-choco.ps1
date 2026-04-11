[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri "https://community.chocolatey.org/install.ps1" -OutFile "install-choco.ps1"
.\install-choco.ps1
