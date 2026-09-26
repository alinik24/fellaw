[CmdletBinding()]
param([switch]$SkipInstall)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

if (-not (Test-Path (Join-Path $root '.env'))) {
    Copy-Item (Join-Path $root '.env.example') (Join-Path $root '.env')
    Write-Host 'Created .env from the safe template; review values before starting services.'
}

if (-not $SkipInstall) {
    $venv = Join-Path $root '.venv'
    if (-not (Test-Path $venv)) { python -m venv $venv }
    & (Join-Path $venv 'Scripts\python.exe') -m pip install -r (Join-Path $root 'backend\requirements.txt') pytest
    npm --prefix (Join-Path $root 'frontend') ci
}

Write-Host 'Bootstrap complete. Run scripts\doctor.ps1, then docker compose up --build.'
