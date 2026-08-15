@echo off
rem One-time test launcher
rem 自动请求管理员权限：WorkBuddy 以管理员运行时会拦截低权限进程的模拟键盘（UIPI），
rem 因此本脚本需要与 WorkBuddy 同级权限才能正常发送回车。
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting administrator privileges...
    powershell -NoProfile -Command "Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"%~dp0once-test.ps1\"' -Verb RunAs"
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0once-test.ps1"
)
pause
