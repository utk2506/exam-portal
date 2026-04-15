# AI Proctor Service Launcher (PowerShell)
# This script provides better process management and error handling than batch files

$ErrorActionPreference = "Stop"

Write-Host "============================================"
Write-Host "    AI PROCTOR SERVICE - STANDALONE TEST"
Write-Host "============================================"
Write-Host ""

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$aiProctorDir = Join-Path $scriptDir "services\ai-proctor"

if (-not (Test-Path $aiProctorDir)) {
    Write-Host "ERROR: services\ai-proctor directory not found!" -ForegroundColor Red
    Write-Host "Expected: $aiProctorDir"
    exit 1
}

if (-not (Test-Path "$aiProctorDir\app.py")) {
    Write-Host "ERROR: app.py not found in $aiProctorDir" -ForegroundColor Red
    exit 1
}

Write-Host "Current directory: $aiProctorDir"
Write-Host ""

# Check Python
Write-Host "Checking Python installation..."
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: Python not found in PATH!" -ForegroundColor Red
    Write-Host "Please install Python and add it to PATH."
    exit 1
}
Write-Host ""

# Check port 8091
Write-Host "Checking if port 8091 is available..."
$portInUse = netstat -ano | Select-String ":8091" -Quiet
if ($portInUse) {
    Write-Host "✗ WARNING: Port 8091 is already in use!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Processes using port 8091:"
    netstat -ano | Select-String ":8091"
    exit 1
} else {
    Write-Host "✓ Port 8091 is available" -ForegroundColor Green
}
Write-Host ""

# Install dependencies
Write-Host "Installing/checking dependencies..."
try {
    pip install -r "$aiProctorDir\requirements.txt" -q
    Write-Host "✓ Dependencies are ready" -ForegroundColor Green
} catch {
    Write-Host "⚠ Warning: Some dependencies may have issues" -ForegroundColor Yellow
}
Write-Host ""

# Start the service
Write-Host "Starting AI Proctor service on port 8091..."
Write-Host "Service will be available at: http://localhost:8091"
Write-Host "Health check endpoint: http://localhost:8091/health"
Write-Host ""
Write-Host "Press Ctrl+C to stop the service."
Write-Host "============================================"
Write-Host ""

Set-Location $aiProctorDir
python -m uvicorn app:app --host 0.0.0.0 --port 8091 --log-level info
