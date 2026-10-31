# Installs Bubble Wrap silently for the current Windows user.
# Source: https://github.com/jd4rider/bubble-wrap
$ErrorActionPreference = 'Stop'

$url = 'https://github.com/jd4rider/bubble-wrap/releases/download/v0.1.0/Bubble-Wrap-win-setup.exe'
$expected = '61CC22E771BF534CA4250F5B85B8AAAEAD2A7B0DB9C5B10021F5C2BA78AE22DC'
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
