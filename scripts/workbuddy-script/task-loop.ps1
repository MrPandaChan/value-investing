# task-loop.ps1
# 循环任务脚本：按 config.json 中的 interval_seconds（默认 180 秒 = 3 分钟）周期执行
# 每次执行：读取 prompt.md -> 打开 WorkBuddy 新建任务 -> 2 秒后发送回车
# 停止方式：按 Ctrl+C
# 运行方式：双击 run-loop.bat，或 powershell -ExecutionPolicy Bypass -File task-loop.ps1

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$configPath = Join-Path $scriptDir "config.json"
$promptFile = Join-Path $scriptDir "prompt.md"
$libFile    = Join-Path $scriptDir "lib\build-task-url.ps1"
$logFile    = Join-Path $scriptDir "task-loop.log"

foreach ($f in @($configPath, $promptFile, $libFile)) {
    if (-not (Test-Path $f)) { throw "缺少文件: $f" }
}

. $libFile

$config = Get-Content -Raw -Encoding UTF8 $configPath | ConvertFrom-Json
$interval = [double]$config.interval_seconds

# 带时间戳的日志输出（控制台 + 文件）
function Write-Log {
    param([string]$Msg)
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Msg"
    Write-Host $line
    try { Add-Content -Path $logFile -Value $line -Encoding UTF8 } catch { }
}

if ($interval -le 0) { $interval = 180 }
if (-not ($config.PSObject.Properties.Name -contains "interval_seconds")) {
    Write-Log "警告：config.json 缺少 interval_seconds，使用默认 180 秒"
}

Write-Log "task-loop 启动：执行间隔 $interval 秒（约 $([math]::Round($interval/60, 1)) 分钟），按 Ctrl+C 停止"
Write-Log "skills = '$($config.skills)' | cwd = '$(if ($config.cwd) { $config.cwd } else { $scriptDir })'"
Write-Log "日志文件：$logFile"

$counter = 0
while ($true) {
    $counter++
    Write-Log "===== 第 $counter 次执行 ====="
    try {
        Send-WorkBuddyTask -ConfigPath $configPath -PromptFile $promptFile
        Write-Log "任务已提交，$interval 秒后执行下一次..."
    } catch {
        Write-Log "执行失败：$($_.Exception.Message)"
    }
    Start-Sleep -Seconds $interval
}
