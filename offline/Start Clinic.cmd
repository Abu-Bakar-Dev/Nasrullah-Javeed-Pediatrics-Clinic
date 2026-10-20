@echo off
cd /d "%~dp0"
if not exist "node.exe" (
  echo Missing bundled runtime. Run npm run offline:build from the source project first.
  pause
  exit /b 1
)
echo Open http://127.0.0.1:4317 in your browser.
echo Phone addresses will be printed below. All devices must use the same clinic Wi-Fi.
echo Keep this window open and the laptop awake while using the clinic.
"%~dp0node.exe" "%~dp0server.mjs"
pause
