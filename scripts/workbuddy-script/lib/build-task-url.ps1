# build-task-url.ps1
# 公共函数库：从 config.json + prompt 内容构造 workbuddy:// 任务 URL
# 被 once-test.ps1 与 task-loop.ps1 通过 . (点源) 方式加载

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

# 模拟回车键发送任务（打开 URL 并等待 enter_delay_seconds 后执行）
function Send-WorkBuddyTask {
    param(
        [Parameter(Mandatory = $true)][string]$PromptContent,
        [Parameter(Mandatory = $true)][string]$ConfigPath
    )

    $config = Get-Content -Raw -Encoding UTF8 $ConfigPath | ConvertFrom-Json
    $url = Build-TaskUrl -PromptContent $PromptContent -ConfigPath $ConfigPath

    Write-Host "打开 WorkBuddy 并创建任务..."
    Start-Process $url

    # 等待新建任务框出现（默认 2 秒，可通过 config 调整）
    Start-Sleep -Seconds ([double]$config.enter_delay_seconds)

    $wshell = New-Object -ComObject wscript.shell

    # 可选：将焦点切换到 WorkBuddy 窗口（app_name 为进程名或窗口标题片段）
    if ($config.app_name) {
        try {
            [void]$wshell.AppActivate([string]$config.app_name)
            Start-Sleep -Milliseconds 300
        } catch {
            Write-Warning "AppActivate 失败（$($config.app_name)），将继续在当前焦点窗口发送回车"
        }
    }

    # 发送回车键触发任务发送
    $wshell.SendKeys("{ENTER}")
    Write-Host "已发送回车键，任务已提交。"
}
