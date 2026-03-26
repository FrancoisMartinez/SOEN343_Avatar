Write-Host "Starting Spring Boot backend..." -ForegroundColor Cyan
Set-Location -Path $PSScriptRoot

# Load environment variables from .env (so HERE_API_KEY and others are available to Spring Boot)
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ([string]::IsNullOrWhiteSpace($line)) { return }
    if ($line.StartsWith("#")) { return }
    if (-not $line.Contains("=")) { return }

    $parts = $line.Split("=", 2)
    $key = $parts[0].Trim()
    $value = $parts[1]
    if ($key) {
      # Environment variables for the current process (and child mvn process)
      Set-Item -Path ("Env:" + $key) -Value $value
    }
  }
}

# Quick sanity check (avoid printing secrets).
if (Test-Path env:HERE_API_KEY) {
  $hereLen = if ($null -eq $env:HERE_API_KEY) { 0 } else { $env:HERE_API_KEY.Length }
  Write-Host ("HERE_API_KEY loaded (length=" + $hereLen + ")") -ForegroundColor Yellow
} else {
  Write-Host "HERE_API_KEY not found in environment after .env load." -ForegroundColor Red
}

# Forward all extra arguments to mvnw.cmd
.\mvnw.cmd spring-boot:run @args
