$ErrorActionPreference = "Stop"

function Get-PostgresBinDirectory {
  $installRoot = "C:\Program Files\PostgreSQL"
  $versions = Get-ChildItem $installRoot -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending

  foreach ($version in $versions) {
    $binDir = Join-Path $version.FullName "bin"
    if (Test-Path (Join-Path $binDir "pg_ctl.exe")) {
      return $binDir
    }
  }

  throw "PostgreSQL binaries were not found under C:\Program Files\PostgreSQL."
}

function Test-PostgresPort {
  $result = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue
  return $result.TcpTestSucceeded
}

$binDir = Get-PostgresBinDirectory
$runtimeRoot = Join-Path $env:LOCALAPPDATA "exam-platform-postgres"
$dataDir = Join-Path $runtimeRoot "data"
$logFile = Join-Path $runtimeRoot "postgres.log"
$pwFile = Join-Path $runtimeRoot "pg-password.txt"

New-Item -ItemType Directory -Force -Path $runtimeRoot | Out-Null

if (-not (Test-Path (Join-Path $dataDir "PG_VERSION"))) {
  Set-Content -Path $pwFile -Value "postgres" -NoNewline
  & (Join-Path $binDir "initdb.exe") `
    -D $dataDir `
    -U postgres `
    -A scram-sha-256 `
    --pwfile=$pwFile

  if ($LASTEXITCODE -ne 0) {
    throw "initdb failed."
  }
}

if (-not (Test-PostgresPort)) {
  & (Join-Path $binDir "pg_ctl.exe") `
    -D $dataDir `
    -l $logFile `
    -o "-p 5432" `
    start

  if ($LASTEXITCODE -ne 0) {
    throw "pg_ctl failed to start PostgreSQL."
  }

  Start-Sleep -Seconds 3
}

if (-not (Test-PostgresPort)) {
  throw "PostgreSQL is still not reachable on localhost:5432 after startup."
}

$env:PGPASSWORD = "postgres"
$databaseExists = & (Join-Path $binDir "psql.exe") `
  -h localhost `
  -p 5432 `
  -U postgres `
  -d postgres `
  -tAc "SELECT 1 FROM pg_database WHERE datname = 'exam_platform';"

if ($databaseExists.Trim() -ne "1") {
  & (Join-Path $binDir "createdb.exe") -h localhost -p 5432 -U postgres exam_platform
  if ($LASTEXITCODE -ne 0) {
    throw "createdb failed."
  }
}

Write-Host "PostgreSQL is running on localhost:5432" -ForegroundColor Green
Write-Host "Data directory: $dataDir" -ForegroundColor Green
