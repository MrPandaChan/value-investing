# build-task-url.ps1
# 公共函数库：从 config.json + prompt 内容构造 workbuddy:// 任务 URL
# 被 once-test.ps1 与 task-loop.ps1 通过 . (点源) 方式加载

# 将对象序列化为 JSON（2 空格缩进，与项目风格一致）
# 做法：ConvertTo-Json 输出（无论 PS5.1 的怪异缩进）先压成单行，再用标准 pretty-printer
# 按 2 空格重新排版，确保输出格式完全可控。
function ConvertTo-Json2 {
    param(
        [Parameter(Mandatory = $true)]$Object,
        [int]$Depth = 10
    )
    $raw = $Object | ConvertTo-Json -Depth $Depth
    # 压成单行（去掉换行及行首缩进空格，避免残留空格混入 JSON）
    $compact = ($raw -replace "`r?`n\s*", '').Trim()
    # 统一冒号后空格为单个（PS5.1 的 ConvertTo-Json 冒号后是 2 空格）
    $compact = $compact -replace ':\s{2,}', ': '

    $sb = New-Object System.Text.StringBuilder
    $indent = 0
    $inString = $false
    $escaped = $false

    for ($i = 0; $i -lt $compact.Length; $i++) {
        $c = $compact[$i]
        if ($inString) {
            [void]$sb.Append($c)
            if ($escaped) { $escaped = $false }
            elseif ($c -eq '\') { $escaped = $true }
            elseif ($c -eq '"') { $inString = $false }
            continue
        }
        switch ($c) {
            '"' {
                $inString = $true
                [void]$sb.Append($c)
            }
            '{' {
                [void]$sb.Append($c)
                [void]$sb.Append("`r`n")
                $indent++
                [void]$sb.Append('  ' * $indent)
            }
            '[' {
                [void]$sb.Append($c)
                [void]$sb.Append("`r`n")
                $indent++
                [void]$sb.Append('  ' * $indent)
            }
            '}' {
                $indent--
                [void]$sb.Append("`r`n")
                [void]$sb.Append('  ' * $indent)
                [void]$sb.Append($c)
            }
            ']' {
                $indent--
                [void]$sb.Append("`r`n")
                [void]$sb.Append('  ' * $indent)
                [void]$sb.Append($c)
            }
            ',' {
                [void]$sb.Append($c)
                [void]$sb.Append("`r`n")
                [void]$sb.Append('  ' * $indent)
            }
            ':' {
                # 冒号本身；冒号后的单个空格在压缩阶段已统一，由 default 分支保留
                [void]$sb.Append($c)
            }
            default {
                [void]$sb.Append($c)
            }
        }
    }
    return $sb.ToString()
}

function Build-TaskUrl {
    param(
        [Parameter(Mandatory = $true)][string]$PromptContent,
        [Parameter(Mandatory = $true)][string]$ConfigPath
    )

    # 读取配置（UTF-8 显式指定，避免中文乱码）
    $config = Get-Content -Raw -Encoding UTF8 $ConfigPath | ConvertFrom-Json

    # cwd：config 中显式配置优先，否则取脚本目录
    $cwd = if ($config.cwd) { $config.cwd } else { Split-Path -Parent $ConfigPath }

    # URL 编码（等价于 JS 的 encodeURIComponent）
    $encodedPrompt = [uri]::EscapeDataString($PromptContent)
    $encodedCwd    = [uri]::EscapeDataString($cwd)

    # 拼接 URL（与 workbuddy 协议格式一致）
    $url = "workbuddy://task?action=start&prompt=$encodedPrompt"
    if ($config.skills) {
        $encodedSkills = [uri]::EscapeDataString([string]$config.skills)
        $url += "&skills=$encodedSkills"
    }
    $url += "&cwd=$encodedCwd"

    return $url
}

# 查找 WorkBuddy 主窗口进程（Electron 多进程，只有主进程有 MainWindowHandle）
function Get-WorkBuddyProcess {
    return Get-Process -Name 'WorkBuddy' -ErrorAction SilentlyContinue |
        Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero } |
        Select-Object -First 1
}

# 激活 WorkBuddy 主窗口（按进程 ID，比按窗口标题更可靠）
function Activate-WorkBuddyWindow {
    param(
        [Parameter(Mandatory = $false)][string]$AppName = 'WorkBuddy'
    )
    $proc = Get-WorkBuddyProcess
    $wshell = New-Object -ComObject wscript.shell
    if ($proc) {
        try {
            [void]$wshell.AppActivate($proc.Id)
            Start-Sleep -Milliseconds 300
            return $true
        } catch {
            Write-Warning "AppActivate(PID=$($proc.Id)) 失败：$($_.Exception.Message)"
        }
    } elseif ($AppName) {
        try {
            [void]$wshell.AppActivate($AppName)
            Start-Sleep -Milliseconds 300
            return $true
        } catch {
            Write-Warning "AppActivate($AppName) 失败：$($_.Exception.Message)"
        }
    }
    return $false
}

# 模拟回车键发送任务（打开 URL 并等待 enter_delay_seconds 后执行）
function Send-WorkBuddyTask {
    param(
        [Parameter(Mandatory = $true)][string]$PromptContent,
        [Parameter(Mandatory = $true)][string]$ConfigPath
    )

    $config = Get-Content -Raw -Encoding UTF8 $ConfigPath | ConvertFrom-Json
    $url = Build-TaskUrl -PromptContent $PromptContent -ConfigPath $ConfigPath

    $sw = [System.Diagnostics.Stopwatch]::StartNew()

    Write-Host "打开 WorkBuddy 并创建任务..."
    Start-Process $url
    Write-Host ("  [耗时 {0:N1}s] URL 已打开" -f $sw.Elapsed.TotalSeconds)

    # 等待新建任务框出现（enter_delay_seconds，可通过 config 调整）
    Start-Sleep -Seconds ([double]$config.enter_delay_seconds)
    Write-Host ("  [耗时 {0:N1}s] 已等待任务框弹出" -f $sw.Elapsed.TotalSeconds)

    $wshell = New-Object -ComObject wscript.shell

    # 激活 WorkBuddy 主窗口（优先按 PID，回退按 app_name）
    $activated = $false
    if ($config.app_name) {
        $activated = Activate-WorkBuddyWindow -AppName $config.app_name
        Write-Host ("  [耗时 {0:N1}s] AppActivate({1}) = {2}" -f $sw.Elapsed.TotalSeconds, $config.app_name, $activated)
    } else {
        $activated = Activate-WorkBuddyWindow
        Write-Host ("  [耗时 {0:N1}s] 已按 PID 激活 WorkBuddy 主窗口 = {1}" -f $sw.Elapsed.TotalSeconds, $activated)
    }

    # 发送按键配置（默认回车；WorkBuddy 若支持 Ctrl+Enter 发送可改）
    $sendKey = $config.send_key
    if (-not $sendKey) { $sendKey = '~' }
    $sendRepeat = [int]$config.send_repeat
    if ($sendRepeat -lt 1) { $sendRepeat = 1 }

    # 用 System.Windows.Forms.SendKeys.SendWait 模拟真实键盘（比 WScript.Shell.SendKeys 更可靠，
    # Electron/Chromium 应用对 SendWait 注入的回车能正确触发发送）
    Add-Type -AssemblyName System.Windows.Forms
    for ($i = 0; $i -lt $sendRepeat; $i++) {
        [System.Windows.Forms.SendKeys]::SendWait($sendKey)
        Start-Sleep -Milliseconds 500
    }
    Write-Host ("  [耗时 {0:N1}s] 已发送按键 {1} x {2}" -f $sw.Elapsed.TotalSeconds, $sendKey, $sendRepeat)
    Write-Host "任务已提交。"
}
