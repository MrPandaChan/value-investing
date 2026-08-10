@echo off
rem Loop task launcher (interval configurable in config.json), press Ctrl+C to stop
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0task-loop.ps1"
pause
