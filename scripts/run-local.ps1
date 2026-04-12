$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $repoRoot

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Created .env from .env.example" -ForegroundColor Green
}

$dbCheck = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue
if (-not $dbCheck.TcpTestSucceeded) {
  $postgresBootstrap = Join-Path $repoRoot "scripts\start-postgres-local.ps1"
  if (Test-Path $postgresBootstrap) {
    Write-Host "PostgreSQL is not listening yet. Bootstrapping a local cluster from the installed PostgreSQL binaries..." -ForegroundColor Yellow
    & $postgresBootstrap
  } else {
    Write-Host "PostgreSQL is not reachable on localhost:5432 yet." -ForegroundColor Yellow
    Write-Host "Finish the PostgreSQL install and make sure the service is running, then run 'npm run start:local' again." -ForegroundColor Yellow
    exit 1
  }
}

Write-Host "Generating Prisma client..." -ForegroundColor Cyan
npm run prisma:generate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Pushing schema to PostgreSQL..." -ForegroundColor Cyan
npm run prisma:push
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Seeding admin account..." -ForegroundColor Cyan
npm run prisma:seed
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$apiCommand = "Set-Location '$repoRoot'; npm run dev:api"
$frontendCommand = "Set-Location '$repoRoot'; npm run dev:frontend"

Write-Host "Starting API in a new window..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $apiCommand

Start-Sleep -Seconds 2

Write-Host "Starting frontend in a new window..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $frontendCommand

Write-Host ""
Write-Host "Local website bootstrapped." -ForegroundColor Green
Write-Host "Frontend: http://localhost:4173" -ForegroundColor Green
Write-Host "API health: http://localhost:8080/api/health" -ForegroundColor Green
Write-Host "Admin login uses the credentials from .env" -ForegroundColor Green
