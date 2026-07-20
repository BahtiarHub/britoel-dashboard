$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$localSource = Join-Path $root ".env.postgres.local"
$target = Join-Path $root ".env.local"

if (-not (Test-Path -LiteralPath $localSource)) {
  throw ".env.postgres.local tidak ditemukan."
}

function Read-Environment([string]$Path) {
  $values = [ordered]@{}
  foreach ($line in Get-Content -LiteralPath $Path) {
    if ($line -match '^\s*#' -or $line -notmatch '=') { continue }
    $parts = $line -split '=', 2
    $values[$parts[0].Trim()] = $parts[1]
  }
  return $values
}

$localValues = Read-Environment $localSource
$targetLines = [System.Collections.Generic.List[string]]::new()
if (Test-Path -LiteralPath $target) {
  foreach ($line in Get-Content -LiteralPath $target) { $targetLines.Add($line) }
}
$updates = [ordered]@{
  DATABASE_URL = $localValues.DATABASE_URL
  DIRECT_DATABASE_URL = $localValues.DATABASE_URL
  STORAGE_DRIVER = "local"
  LOCAL_STORAGE_ROOT = "./data/uploads"
  SUPABASE_URL = ""
  SUPABASE_SERVICE_ROLE_KEY = ""
}

foreach ($key in $updates.Keys) {
  $replacement = "$key=$($updates[$key])"
  $index = -1
  for ($i = 0; $i -lt $targetLines.Count; $i++) {
    if ($targetLines[$i] -match ('^' + [regex]::Escape($key) + '=')) { $index = $i; break }
  }
  if ($index -ge 0) { $targetLines[$index] = $replacement } else { $targetLines.Add($replacement) }
}

Set-Content -LiteralPath $target -Value $targetLines -Encoding utf8
Write-Output ".env.local sekarang menggunakan PostgreSQL dan penyimpanan file lokal."
