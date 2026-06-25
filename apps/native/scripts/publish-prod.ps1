$Version = $args[0]
if (-not $Version) {
  Write-Host "Usage: publish-prod.ps1 <version>"
  Write-Host "  e.g. publish-prod.ps1 1.0.0"
  exit 1
}

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$MonorepoRoot = Resolve-Path (Join-Path $RootDir '..\..')
$ReleaseDir = Join-Path (Join-Path $RootDir 'releases') $Version

Write-Host "=== Publishing Nowly Host v$Version to CDN ==="
Write-Host ""

# Check all required files exist
$RequiredFiles = @(
  'nowly-setup.exe',
  'nowly-windows.zip',
  'nowly-linux.tar.gz',
  'nowly-macos.tar.gz'
)

$Missing = $false
foreach ($file in $RequiredFiles) {
  $path = Join-Path $ReleaseDir $file
  if (-not (Test-Path $path)) {
    Write-Host "   x Missing: $path"
    $Missing = $true
  }
}

if ($Missing) {
  Write-Host ""
  Write-Host "Build the release first:"
  Write-Host "  make release HOST_VERSION=$Version"
  exit 1
}

Write-Host "   + All artifacts found in releases/$Version/"
Write-Host ""

# Publish to CDN via internal CLI
Push-Location $MonorepoRoot
try {
  & pnpm internal-cli host:publish `
    --release-version $Version `
    --installer (Join-Path $ReleaseDir 'nowly-setup.exe') `
    --portable (Join-Path $ReleaseDir 'nowly-windows.zip') `
    --linux (Join-Path $ReleaseDir 'nowly-linux.tar.gz') `
    --macos (Join-Path $ReleaseDir 'nowly-macos.tar.gz')
  if ($LASTEXITCODE -ne 0) {
    throw "pnpm internal-cli host:publish failed with exit code $LASTEXITCODE"
  }
} finally {
  Pop-Location
}

Write-Host ""
Write-Host "=== Done! v$Version published to CDN ==="
