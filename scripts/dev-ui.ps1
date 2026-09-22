# Run from project root after: nvm use 22.14.0
$nodeDir = "$env:APPDATA\nvm\v22.14.0"
if (-not (Test-Path "$nodeDir\node.exe")) {
  Write-Error "Node 22.14.0 not found. Run: nvm install 22.14.0"
  exit 1
}
$env:Path = "$nodeDir;" + $env:Path
Set-Location $PSScriptRoot\..
npm run dev --prefix app/library-ui
