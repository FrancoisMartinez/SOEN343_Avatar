Write-Host "Starting Spring Boot backend..." -ForegroundColor Cyan
Set-Location -Path $PSScriptRoot
.\mvnw.cmd spring-boot:run
