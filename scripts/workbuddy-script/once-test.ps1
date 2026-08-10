# once-test.ps1
# 一次性测试脚本：读取 prompt.md -> 打开 WorkBuddy 新建任务 -> 2 秒后发送回车
# 运行方式：双击 run-once.bat，或 powershell -ExecutionPolicy Bypass -File once-test.ps1

$ErrorActionPreference = "Stop"

# 脚本所在目录（兼容从任意路径调用）
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$configPath = Join-Path $scriptDir "config.json"
$promptFile = Join-Path $scriptDir "prompt.md"
$libFile    = Join-Path $scriptDir "lib\build-task-url.ps1"

# 校验必需文件是否存在
foreach ($f in @($configPath, $promptFile, $libFile)) {
    if (-not (Test-Path $f)) { throw "缺少文件: $f" }
}

# 加载公共函数
. $libFile

$config = Get-Content -Raw -Encoding UTF8 $configPath | ConvertFrom-Json

Write-Host "==================== once-test ===================="
Write-Host "config : $configPath"
Write-Host "prompt : $promptFile"
Write-Host "enter_delay_seconds : $($config.enter_delay_seconds)"
Write-Host "app_name           : $($config.app_name)"
Write-Host "skills             : $($config.skills)"
Write-Host "cwd                : $(if ($config.cwd) { $config.cwd } else { $scriptDir })"
Write-Host "==================================================="

try {
    $url = Build-TaskUrl -ConfigPath $configPath -PromptFile $promptFile
    Write-Host ""
    Write-Host "构造的任务 URL："
    Write-Host $url
    Write-Host ""
    Send-WorkBuddyTask -ConfigPath $configPath -PromptFile $promptFile
    Write-Host ""
    Write-Host "完成。请检查 WorkBuddy 是否已弹出任务并自动发送。"
} catch {
    Write-Host ""
    Write-Host "[错误] $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
