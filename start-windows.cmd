@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. See README.md for setup or the Python alternative.
  pause
  exit /b 1
)
node server.mjs
pause
