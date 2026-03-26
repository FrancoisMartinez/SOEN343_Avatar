@echo off
echo Starting Spring Boot backend...
cd /d "%~dp0"

REM Load environment variables from .env so Spring Boot can see HERE_API_KEY (and others)
setlocal enabledelayedexpansion
if exist ".env" (
  for /f "tokens=1,* delims==" %%A in ('findstr /v /b /c:"#" .env') do (
    if not "%%A"=="" (
      set "key=%%A"
      set "value=%%B"
      set !key!=!value!
    )
  )
)

call .\mvnw.cmd spring-boot:run
endlocal
pause
