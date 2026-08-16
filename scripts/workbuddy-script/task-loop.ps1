# task-loop.ps1
# 自动任务队列脚本（并行版）：
#   1. 直接轮询读取 tasks.json（每次循环重新读取，作为唯一状态源）
#   2. 任务状态机：pending -> running -> done / failed（各任务独立维护）
#   3. 并行机制：最多同时运行 max_concurrent 个任务；每 send_interval_seconds 秒发送一个新任务
#   4. 轮询检测输出文件是否生成（文件存在且大小稳定超过阈值）→ 标记 done
#   5. 超时重试：超过 task_timeout_minutes 无输出，重发（受 max_retries 限制），仍失败标记 failed
#   6. 全部任务结束（无 pending/running）后退出
# 停止方式：Ctrl+C
# 运行方式：双击 run-loop.bat，或 powershell -ExecutionPolicy Bypass -File task-loop.ps1

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$configPath = Join-Path $scriptDir "config.json"
$tasksPath  = Join-Path $scriptDir "tasks.json"
$libFile    = Join-Path $scriptDir "lib\build-task-url.ps1"
$logFile    = Join-Path $scriptDir "task-loop.log"

foreach ($f in @($configPath, $tasksPath, $libFile)) {
    if (-not (Test-Path $f)) { throw "缺少文件: $f" }
}

. $libFile

$config = Get-Content -Raw -Encoding UTF8 $configPath | ConvertFrom-Json

$promptFile    = Join-Path $scriptDir $config.prompt_template
$outputRoot    = $config.output_root
if (-not $outputRoot) { $outputRoot = $scriptDir }
if (-not (Test-Path $promptFile)) { throw "缺少 prompt 模板: $promptFile" }

# 拆解框架文件绝对路径（从 config.json 读取，UTF-8 解码避免编码歧义）
$frameworkRel  = $config.framework_file
$frameworkFile = Join-Path $outputRoot ($frameworkRel -replace '/', '\')
if (-not (Test-Path $frameworkFile)) { throw "缺少拆解框架文件: $frameworkFile" }

$pollSeconds  = [double]$config.poll_seconds
if ($pollSeconds -le 0) { $pollSeconds = 30 }
$sendInterval = [double]$config.send_interval_seconds
if ($sendInterval -lt 0) { $sendInterval = 60 }
$maxConcurrent = [int]$config.max_concurrent
if ($maxConcurrent -lt 1) { $maxConcurrent = 3 }
$timeoutMin   = [double]$config.task_timeout_minutes
if ($timeoutMin -le 0) { $timeoutMin = 30 }
$maxRetries   = [int]$config.max_retries
if ($maxRetries -lt 0) { $maxRetries = 2 }
$minBytes     = [double]$config.min_file_bytes
if ($minBytes -le 0) { $minBytes = 5000 }
$stableChecks = [int]$config.stable_checks
if ($stableChecks -lt 1) { $stableChecks = 3 }
$completionMarker = [string]$config.completion_marker
if (-not $completionMarker) { $completionMarker = '47. 最终洞见与哲学反思' }
$sendKey = $config.send_key
if (-not $sendKey) { $sendKey = '{ENTER}' }
$sendRepeat = [int]$config.send_repeat
if ($sendRepeat -lt 1) { $sendRepeat = 1 }

# 带时间戳的日志输出（控制台 + 文件）
function Write-Log {
    param([string]$Msg)
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Msg"
    Write-Host $line
    try { Add-Content -Path $logFile -Value $line -Encoding UTF8 } catch { }
}

# 读取 tasks.json（每次都重新读取，确保以磁盘为准）
function Read-Tasks {
    return @((Get-Content -Raw -Encoding UTF8 $tasksPath | ConvertFrom-Json).tasks)
}

# 写回 tasks.json（原子化：先写临时文件再替换，避免半写状态）
function Save-Tasks {
    param($TasksArray)
    $obj = @{ tasks = @($TasksArray) }
    $json = ConvertTo-Json2 -Object $obj -Depth 10
    $tmp = "$tasksPath.tmp"
    [System.IO.File]::WriteAllText($tmp, $json, (New-Object System.Text.UTF8Encoding($false)))
    Move-Item -Path $tmp -Destination $tasksPath -Force
}

# 计算输出文件绝对路径
function Get-OutputPath {
    param([object]$Task)
    $rel = [string]$Task.output -replace '/', '\'
    return Join-Path $outputRoot $rel
}

# 检查输出文件内容是否包含完成标记（任务输出为逐部分写入，需确认写到最后一个模块才算完成）
function Test-CompletionMarker {
    param([string]$Path)
    try {
        $content = [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
        return $content.Contains($completionMarker)
    } catch {
        return $false
    }
}

# 生成单次任务的 prompt（模板 + 注入字段）
function Build-TaskPrompt {
    param([object]$Task)
    $template = Get-Content -Raw -Encoding UTF8 $promptFile
    $outPath = Get-OutputPath -Task $Task
    $prompt = $template
    $prompt = $prompt.Replace('{TASK_NAME}', [string]$Task.name)
    $prompt = $prompt.Replace('{ANALYSIS_TARGET}', [string]$Task.target)
    $prompt = $prompt.Replace('{OUTPUT_FILE}', $outPath)
    $prompt = $prompt.Replace('{FRAMEWORK_FILE}', $frameworkFile)
    $prompt = $prompt.Replace('{DATA_DATE}', (Get-Date -Format 'yyyy-MM-dd'))
    return $prompt
}

# 预创建任务的输出文件（空的即可）。目的：
#   1. 任务一发送，目标文件就存在，轮询判断有明确基准；
#   2. 避免"文件不存在"与"任务还没真正开始"混淆。
function Ensure-OutputFile {
    param([object]$Task)
    $outPath = Get-OutputPath -Task $Task
    $dir = Split-Path -Parent $outPath
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    if (-not (Test-Path $outPath)) {
        [System.IO.File]::WriteAllText($outPath, '', (New-Object System.Text.UTF8Encoding($false)))
        Write-Log "已预创建空输出文件：$outPath"
    } else {
        Write-Log "输出文件已存在（不覆盖）：$outPath"
    }
}

# 尝试发送任务：预创建输出文件 -> 标记 running 并写回 -> 真实发送
function Send-Task {
    param([object]$Task, [int]$Attempt)
    $nowStr = (Get-Date).ToString('yyyy-MM-ddTHH:mm:ss')
    # 先预创建输出文件，再标记 running
    Ensure-OutputFile -Task $Task
    $Task.status = 'running'
    $Task.attempts = $Attempt
    $Task.last_sent = $nowStr
    Save-Tasks -TasksArray (Get-TasksSnapshot)
    try {
        Send-WorkBuddyTask -PromptContent (Build-TaskPrompt -Task $Task) -ConfigPath $configPath
        Write-Log "已提交任务 [$($Task.id)] $($Task.name)（第 $Attempt 次），等待输出：$(Get-OutputPath -Task $Task)"
        return $true
    } catch {
        Write-Log "任务 [$($Task.id)] $($Task.name) 提交失败：$($_.Exception.Message)"
        return $false
    }
}

# 辅助：获取当前 tasks 数组快照（在 Send-Task 中写回前调用）
$script:currentTasks = @()
function Get-TasksSnapshot {
    return $script:currentTasks
}

Write-Log "task-loop 启动：并发上限 $maxConcurrent，发送间隔 $sendInterval 秒，轮询 $pollSeconds 秒，按 Ctrl+C 停止"
Write-Log "skills = '$($config.skills)' | cwd = '$($config.cwd)'"
Write-Log "日志文件：$logFile"

# 记录每任务的文件大小历史（用于稳定性判断）
$fileHistory = @{}

# 记录上次发送时间（节拍控制）
$lastSendTime = $null

while ($true) {
    $script:currentTasks = Read-Tasks
    $now = Get-Date

    # ---- 1. 检查所有 running 任务：完成 / 回车补发 / 超时 ----
    foreach ($task in $script:currentTasks) {
        if ($task.status -ne 'running') { continue }

        $outPath = Get-OutputPath -Task $task
        $outReady = $false
        $currentSize = 0

        if (Test-Path $outPath) {
            $fi = Get-Item $outPath
            $currentSize = $fi.Length
            # 完成判断：大小达标 + 内容包含最后一个模块的完成标记
            if ($currentSize -ge $minBytes -and (Test-CompletionMarker -Path $outPath)) {
                $outReady = $true
            } elseif ($currentSize -ge $minBytes) {
                Write-Log "任务 [$($task.id)] $($task.name) 输出文件 $([math]::Round($currentSize/1KB,1)) KB 但尚未写到完成标记（$completionMarker），继续等待..."
            }
            # 注意：文件为空（0字节）属于正常状态——发送任务时已预创建空文件，
            # 空文件说明 WorkBuddy 尚未开始写入，继续等待即可。
        }

        if ($outReady) {
            # 稳定性判断：连续 stable_checks 次大小不变
            $key = [string]$task.id
            if (-not $fileHistory.ContainsKey($key)) {
                $fileHistory[$key] = @{ size = $currentSize; count = 0 }
            }
            if ($fileHistory[$key].size -eq $currentSize) {
                $fileHistory[$key].count++
            } else {
                $fileHistory[$key] = @{ size = $currentSize; count = 1 }
            }
            if ($fileHistory[$key].count -ge $stableChecks) {
                $task.status = 'done'
                Save-Tasks -TasksArray $script:currentTasks
                Write-Log "任务 [$($task.id)] $($task.name) 完成（输出 $([math]::Round($currentSize/1KB,1)) KB，含完成标记）"
                $fileHistory.Remove($key)
                continue
            }
        } else {
            $fileHistory.Remove([string]$task.id)
        }

        # 超时检查：基准时间为 max(last_sent, 输出文件最后写入时间)
        # 只要文件仍在被写入（逐部分输出持续追加），就不断重置超时计时，避免误重发
        if ($task.last_sent) {
            $lastSentDate = [datetime]::Parse($task.last_sent)
            $baseTime = $lastSentDate
            if (Test-Path $outPath) {
                $writeTime = (Get-Item $outPath).LastWriteTime
                if ($writeTime -gt $baseTime) { $baseTime = $writeTime }
            }
            $elapsedMin = ($now - $baseTime).TotalMinutes
            if ($elapsedMin -ge $timeoutMin) {
                if ([int]$task.attempts -lt $maxRetries) {
                    $newAttempt = [int]$task.attempts + 1
                    Write-Log "任务 [$($task.id)] $($task.name) 超时（$([math]::Round($elapsedMin,1)) 分钟无进展），第 $newAttempt 次重发..."
                    $null = Send-Task -Task $task -Attempt $newAttempt
                    $lastSendTime = $now
                } else {
                    $task.status = 'failed'
                    Save-Tasks -TasksArray $script:currentTasks
                    Write-Log "任务 [$($task.id)] $($task.name) 超过 $maxRetries 次重试仍无输出，标记为 failed"
                    $fileHistory.Remove([string]$task.id)
                }
            }
        } else {
            # last_sent 为空说明状态异常，重置为 pending 兜底
            $task.status = 'pending'
            Save-Tasks -TasksArray $script:currentTasks
            Write-Log "任务 [$($task.id)] $($task.name) last_sent 为空，重置为 pending"
        }
    }

    # ---- 2. 节拍控制：判断是否可以发送新任务 ----
    $runningCount = @($script:currentTasks | Where-Object { $_.status -eq 'running' }).Count
    $pendingCount = @($script:currentTasks | Where-Object { $_.status -eq 'pending' }).Count

    $canSend = ($runningCount -lt $maxConcurrent) -and ($pendingCount -gt 0)
    if ($canSend -and $lastSendTime) {
        $elapsedSinceSend = ($now - $lastSendTime).TotalSeconds
        if ($elapsedSinceSend -lt $sendInterval) { $canSend = $false }
    }

    # ---- 3. 发送新任务（最多补到 max_concurrent，但保持发送间隔节拍）----
    while ($canSend) {
        $script:currentTasks = Read-Tasks
        $runningCount = @($script:currentTasks | Where-Object { $_.status -eq 'running' }).Count
        $pendingCount = @($script:currentTasks | Where-Object { $_.status -eq 'pending' }).Count
        if ($runningCount -ge $maxConcurrent -or $pendingCount -le 0) {
            $canSend = $false
            break
        }

        # 取最早未处理的任务（按 id 排序）
        $nextTask = $script:currentTasks | Where-Object { $_.status -eq 'pending' } |
            Sort-Object { [int]$_.id } | Select-Object -First 1
        if (-not $nextTask) { $canSend = $false; break }

        $newAttempt = [int]$nextTask.attempts + 1
        $sent = Send-Task -Task $nextTask -Attempt $newAttempt
        $lastSendTime = $now

        # 发送成功后再次评估并发上限与节拍
        $script:currentTasks = Read-Tasks
        $runningCount = @($script:currentTasks | Where-Object { $_.status -eq 'running' }).Count
        if ($runningCount -ge $maxConcurrent) { $canSend = $false }
        if (($now - $lastSendTime).TotalSeconds -lt $sendInterval) { $canSend = $false }
    }

    # ---- 4. 全部结束判断 ----
    $script:currentTasks = Read-Tasks
    $remaining = @($script:currentTasks | Where-Object { $_.status -eq 'pending' -or $_.status -eq 'running' }).Count
    if ($remaining -eq 0) {
        $doneCount = @($script:currentTasks | Where-Object { $_.status -eq 'done' }).Count
        $failedCount = @($script:currentTasks | Where-Object { $_.status -eq 'failed' }).Count
        Write-Log "===== 全部任务处理结束：done=$doneCount failed=$failedCount ====="
        break
    }

    Start-Sleep -Seconds $pollSeconds
}
