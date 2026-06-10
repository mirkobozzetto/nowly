param([string]$Version)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$DistDir = Join-Path $RootDir 'dist'

Write-Host "=== Building Windows binary + installer ==="
Write-Host "Version: $Version"
Write-Host ""

New-Item -ItemType Directory -Force -Path $DistDir | Out-Null

$env:GOOS = 'windows'
$env:GOARCH = 'amd64'
& go build -ldflags "-X nowly.client/native/internal/contract.HostVersion=$Version" -o (Join-Path $DistDir 'nowly-host.exe') ./cmd/host
Write-Host "  + nowly-host.exe"

$Iscc = Get-Command 'iscc' -ErrorAction SilentlyContinue
if (-not $Iscc) {
  $isccPaths = @(
    "$env:ProgramFiles\Inno Setup 6\ISCC.exe",
    "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
    "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe"
  )
  foreach ($p in $isccPaths) {
    if (Test-Path $p) { $Iscc = $p; break }
  }
}
& "$Iscc" (Join-Path $RootDir 'installer.iss') "/DAPP_VERSION=$Version"

$SetupExe = Join-Path $DistDir 'NowlySetup.exe'
if (Test-Path $SetupExe) {
  Write-Host "  + NowlySetup.exe"
}
Write-Host ""
Write-Host "=== Done ==="
