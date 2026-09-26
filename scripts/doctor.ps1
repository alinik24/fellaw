[CmdletBinding()]
param([switch]$Full)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$failures = [System.Collections.Generic.List[string]]::new()

function Check-Command([string]$Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) { $failures.Add("Missing command: $Name") }
}

Check-Command git
Check-Command python
Check-Command node
Check-Command npm

foreach ($path in @('.env.example','backend/requirements.txt','frontend/package-lock.json','AGENTS.md','docs/ARCHITECTURE.md')) {
    if (-not (Test-Path (Join-Path $root $path))) { $failures.Add("Missing repository file: $path") }
}

$secretFiles = git -C $root ls-files | Where-Object { $_ -match '(^|/)(\.env|credentials|sessions)(/|$)|\.(pem|key)$|\.sqlite($|[-.])' }
if ($secretFiles) { $failures.Add("Tracked private/runtime files: $($secretFiles -join ', ')") }

if ($Full -and $failures.Count -eq 0) {
    & (Join-Path $root '.venv\Scripts\python.exe') -m pytest (Join-Path $root 'backend\tests') -q
    npm --prefix (Join-Path $root 'frontend') test
    npm --prefix (Join-Path $root 'frontend') run build
}

if ($failures.Count) {
    $failures | ForEach-Object { Write-Error $_ }
    exit 1
}
Write-Host 'Fellaw doctor: OK'
