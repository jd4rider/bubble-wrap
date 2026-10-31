# Installs Bubble Wrap silently for the current Windows user.
# Source: https://github.com/jd4rider/bubble-wrap
$ErrorActionPreference = 'Stop'

$url = 'https://github.com/jd4rider/bubble-wrap/releases/download/v0.2.0/Bubble-Wrap-win-setup.exe'
$expected = 'B4369638FD863652620FEB281296D2BE9226301EDAB4AF17F948DC3DBFD3107B'
$installer = Join-Path $env:TEMP 'Bubble-Wrap-win-setup.exe'

Write-Host 'Downloading Bubble Wrap...'
Invoke-WebRequest -Uri $url -OutFile $installer -UseBasicParsing

$actual = (Get-FileHash -Path $installer -Algorithm SHA256).Hash
if ($actual -ne $expected) {
  Remove-Item $installer -Force
  throw "Checksum mismatch: expected $expected but got $actual."
}

Write-Host 'Installing...'
Start-Process -FilePath $installer -ArgumentList '/S' -Wait
Remove-Item $installer -Force

Write-Host 'Bubble Wrap is installed. Launch it from the Start menu.'
