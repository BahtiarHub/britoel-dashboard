param(
  [ValidateSet("start", "stop", "status")]
  [string]$Action = "status"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$runtime = Join-Path $root "data\postgres-runtime\pgsql"
$dataDirectory = Join-Path $root "data\postgres-cluster"
$pgCtl = Join-Path $runtime "bin\pg_ctl.exe"
$logFile = Join-Path $root "data\postgres-local.log"

if (-not (Test-Path -LiteralPath $pgCtl)) {
  throw "PostgreSQL portable tidak ditemukan di $runtime."
}
if (-not (Test-Path -LiteralPath (Join-Path $dataDirectory "PG_VERSION"))) {
  throw "Cluster PostgreSQL lokal belum tersedia di $dataDirectory."
}

switch ($Action) {
  "start" {
    & $pgCtl status -D $dataDirectory *> $null
    if ($LASTEXITCODE -eq 0) {
      Write-Output "PostgreSQL lokal sudah aktif di 127.0.0.1:5432."
      exit 0
    }
    & $pgCtl start -D $dataDirectory -l $logFile -o '"-h 127.0.0.1 -p 5432"' -w -t 30
    if ($LASTEXITCODE -ne 0) { throw "PostgreSQL lokal gagal dijalankan. Periksa $logFile." }
    Write-Output "PostgreSQL lokal aktif di 127.0.0.1:5432."
  }
  "stop" {
    & $pgCtl status -D $dataDirectory *> $null
    if ($LASTEXITCODE -ne 0) {
      Write-Output "PostgreSQL lokal sudah berhenti."
      exit 0
    }
    & $pgCtl stop -D $dataDirectory -m fast -w -t 30
    if ($LASTEXITCODE -ne 0) { throw "PostgreSQL lokal gagal dihentikan." }
    Write-Output "PostgreSQL lokal berhenti dengan aman."
  }
  "status" {
    & $pgCtl status -D $dataDirectory
    if ($LASTEXITCODE -eq 0) { exit 0 }
    Write-Output "PostgreSQL lokal tidak aktif."
    exit 1
  }
}
