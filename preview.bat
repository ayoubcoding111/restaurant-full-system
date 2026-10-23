@echo off
REM Double-click to preview the Delicious site locally (no database needed).
cd /d "%~dp0"
start "" http://localhost:5173
node client\scripts\preview.js
pause
