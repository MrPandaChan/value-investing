# once-test.ps1
# 一次性测试脚本：读取 tasks.json 第一个 pending 任务 -> 生成 prompt -> 打开 WorkBuddy 并发送
# 注意：发送前会将任务标记为 running 并写回 tasks.json，与 task-loop 状态机保持一致，
#       避免 task-loop 随后重复发送同一个任务。
# 运行方式：双击 run-once.bat，或 powershell -ExecutionPolicy Bypass -File once-test.ps1

$ErrorActionPreference = "Stop"

# 脚本所在目录（兼容从任意路径调用）
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$configPath = Join-Path $scriptDir "config.json"
$tasksPath  = Join-Path $scriptDir "tasks.json"
$libFile    = Join-Path $scriptDir "lib\build-task-url.ps1"

foreach ($f in @($configPath, $tasksPath, $libFile)) {
    if (-not (Test-Path $f)) { throw "缺少文件: $f" }
}

# 加载公共函数
. $libFile

$config = Get-Content -Raw -Encoding UTF8 $configPath | ConvertFrom-Json
$promptFile = Join-Path $scriptDir $config.prompt_template
$outputRoot = $config.output_root
if (-not $outputRoot) { $outputRoot = $scriptDir }

$frameworkRel  = $config.framework_file
$frameworkFile = Join-Path $outputRoot ($frameworkRel -replace '/', '\')

# 读取 tasks 数组
$data = Get-Content -Raw -Encoding UTF8 $tasksPath | ConvertFrom-Json
$tasks = @($data.tasks)
$task = $tasks | Where-Object { $_.status -eq 'pending' } | Sort-Object { [int]$_.id } | Select-Object -First 1

if (-not $task) {
    Write-Host "[提示] tasks.json 中没有 pending 任务，没有可测试的任务。"
    exit 0
}

$template = Get-Content -Raw -Encoding UTF8 $promptFile
$outPath = Join-Path $outputRoot (($task.output) -replace '/', '\')
$prompt = $template
$prompt = $prompt.Replace('{TASK_NAME}', [string]$task.name)
$prompt = $prompt.Replace('{ANALYSIS_TARGET}', [string]$task.target)
$prompt = $prompt.Replace('{OUTPUT_FILE}', $outPath)
$prompt = $prompt.Replace('{FRAMEWORK_FILE}', $frameworkFile)
$prompt = $prompt.Replace('{DATA_DATE}', (Get-Date -Format 'yyyy-MM-dd'))

Write-Host "==================== once-test ===================="
Write-Host "config : $configPath"
Write-Host "测试任务 : [$($task.id)] $($task.name)"
Write-Host "分析对象 : $($task.target)"
Write-Host "输出文件 : $outPath"
Write-Host "enter_delay_seconds : $($config.enter_delay_seconds)"
Write-Host "app_name           : $($config.app_name)"
Write-Host "==================================================="

try {
    # 标记任务为 running 并写回（避免 task-loop 重复发送）
    $nowStr = (Get-Date).ToString('yyyy-MM-ddTHH:mm:ss')
    $task.status = 'running'
    $task.attempts = [int]$task.attempts + 1
    $task.last_sent = $nowStr
    $json = ConvertTo-Json2 -Object @{ tasks = @($tasks) } -Depth 10
    [System.IO.File]::WriteAllText($tasksPath, $json, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "已标记任务 [$($task.id)] 为 running（attempts=$($task.attempts)）"

    $url = Build-TaskUrl -PromptContent $prompt -ConfigPath $configPath
    Write-Host ""
    Write-Host "构造的任务 URL（前 300 字符）："
    Write-Host $url.Substring(0, [Math]::Min(300, $url.Length))
    Write-Host ""
    Send-WorkBuddyTask -PromptContent $prompt -ConfigPath $configPath
    Write-Host ""
    Write-Host "完成。请检查 WorkBuddy 是否已弹出任务并自动发送。"
} catch {
    Write-Host ""
    Write-Host "[错误] $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
