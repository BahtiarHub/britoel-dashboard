$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$environmentFile = Join-Path $root ".env.postgres.local"
$pgDump = Join-Path $root "data\postgres-runtime\pgsql\bin\pg_dump.exe"
$uploads = Join-Path $root "data\uploads"
$backupRoot = Join-Path $root "data\backups"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$workingDirectory = Join-Path $backupRoot "bri-tool-$timestamp"
$archive = Join-Path $backupRoot "bri-tool-$timestamp.zip"

if (-not (Test-Path -LiteralPath $environmentFile)) { throw ".env.postgres.local tidak ditemukan." }
if (-not (Test-Path -LiteralPath $pgDump)) { throw "pg_dump PostgreSQL lokal tidak ditemukan." }

$databaseLine = Get-Content -LiteralPath $environmentFile | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
if (-not $databaseLine) { throw "DATABASE_URL tidak ditemukan di .env.postgres.local." }
$databaseUrl = ($databaseLine -split '=', 2)[1].Trim()

New-Item -ItemType Directory -Force -Path $workingDirectory | Out-Null
$dumpFile = Join-Path $workingDirectory "database.dump"
& $pgDump --dbname=$databaseUrl --format=custom --file=$dumpFile
if ($LASTEXITCODE -ne 0) { throw "Backup PostgreSQL gagal." }

if (Test-Path -LiteralPath $uploads) {
  Copy-Item -LiteralPath $uploads -Destination (Join-Path $workingDirectory "uploads") -Recurse -Force
}
Set-Content -LiteralPath (Join-Path $workingDirectory "backup-info.txt") -Value @(
  "BRI Tool local backup"
  "Created: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')"
  "Contents: PostgreSQL database dump and local uploads"
) -Encoding utf8

Compress-Archive -Path (Join-Path $workingDirectory "*") -DestinationPath $archive -CompressionLevel Optimal
$resolvedWorking = [System.IO.Path]::GetFullPath($workingDirectory)
$resolvedBackupRoot = [System.IO.Path]::GetFullPath($backupRoot) + [System.IO.Path]::DirectorySeparatorChar
if (-not $resolvedWorking.StartsWith($resolvedBackupRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Lokasi kerja backup tidak valid."
}
Remove-Item -LiteralPath $resolvedWorking -Recurse -Force
Write-Output "Backup lokal selesai: $archive"
