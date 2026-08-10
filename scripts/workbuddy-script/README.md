# WorkBuddy 任务自动发送脚本

通过 `workbuddy://` 协议自动打开 WorkBuddy 新建任务框，把 `prompt.md` 的内容填入任务框，等待 2 秒后自动触发回车键发送任务。支持**一次性测试**和**循环定时执行**两种模式，循环间隔、发送延迟、skills、cwd 均可在 `config.json` 中配置。

## 目录结构

```
workbuddy-task-runner/
├── config.json          # 配置文件（间隔、延迟、skills、cwd）
├── prompt.md            # 要发送给 WorkBuddy 的任务内容（每次任务都会发送这里的全文）
├── once-test.ps1        # 一次性测试脚本
├── task-loop.ps1        # 循环执行脚本（默认每 3 分钟一次）
├── run-once.bat         # 双击运行一次性测试
├── run-loop.bat         # 双击运行循环任务
├── lib/
│   └── build-task-url.ps1  # 公共函数库：构造 URL + 模拟回车
└── task-loop.log        # 循环运行日志（自动生成）
```

## 快速开始

### 第 1 步：编辑 prompt.md

把你希望 WorkBuddy 执行的指令写入 `prompt.md`（纯文本或 Markdown 均可），**文件中的全部内容**就是每次发送到任务框的 prompt。

### 第 2 步：一次性测试

双击 `run-once.bat`（或命令行执行 `powershell -ExecutionPolicy Bypass -File once-test.ps1`）。

脚本会：
1. 打印构造好的任务 URL；
2. 打开 WorkBuddy 并弹出新建任务框，自动填入 prompt；
3. 等待 2 秒后自动按回车键发送。

> 先跑一次测试，确认能正常弹出任务框并发送，再启动循环任务。

### 第 3 步：启动循环任务（默认每 3 分钟一次）

双击 `run-loop.bat`。脚本会无限循环执行任务，按 `Ctrl+C` 停止。每次执行的时间、结果都会写入 `task-loop.log`。

## 配置说明（config.json）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `interval_seconds` | number | `180` | 循环执行间隔（秒），`180` = 3 分钟 |
| `enter_delay_seconds` | number | `2` | 打开 WorkBuddy 后等待多久再按回车（秒）。WorkBuddy 启动较慢时适当调大 |
| `app_name` | string | `"WorkBuddy"` | 发送回车前尝试激活的窗口（进程名或窗口标题片段），留空 `""` 则不激活 |
| `skills` | string | `""` | 传入 URL 的 skills 参数，多个用英文逗号分隔，如 `"expert-a,expert-b"`，不需要则留空 |
| `cwd` | string | `""` | 传入 URL 的 cwd 参数，留空时自动使用脚本所在目录 |

修改 `config.json` 后保存即可，**无需重启脚本**（循环脚本每次执行都会重新读取配置）。

## 工作原理

1. 读取 `config.json` 与 `prompt.md`；
2. 用 `[uri]::EscapeDataString` 做 URL 编码，拼出：

   ```
   workbuddy://task?action=start&prompt=<编码后的prompt>&skills=<编码后的skills>&cwd=<编码后的cwd>
   ```

3. 通过 `Start-Process` 交给系统协议处理器打开 WorkBuddy，新建任务框并自动填入 prompt；
4. `Start-Sleep` 等待 `enter_delay_seconds` 秒；
5. 用 `WScript.Shell.SendKeys("{ENTER}")` 模拟回车，触发任务发送。

## 常见问题

**Q1：回车没有生效 / 任务没有发送？**
- 确认 WorkBuddy 已登录且能正常接收 `workbuddy://` 协议；
- 把 `enter_delay_seconds` 调大（如 4~5 秒），等窗口完全弹出；
- 确认 `app_name` 与你的 WorkBuddy 窗口标题匹配（可打开 WorkBuddy 后用任务管理器查看进程名）。若激活失败，脚本会回退到"在当前焦点窗口发送回车"，此时请确保打开 URL 后 WorkBuddy 窗口处于最前。

**Q2：修改了执行间隔为什么不生效？**
`interval_seconds` 每次循环都会重新从 `config.json` 读取，保存即可生效。若改的是正在运行中的脚本，需等当前等待结束后才读取到新值。

**Q3：prompt 里有中文会乱码吗？**
不会。脚本显式以 UTF-8 读取 `prompt.md` 和 `config.json`，URL 编码后交给协议处理。

**Q4：如何停止循环任务？**
在运行 `run-loop.bat` 的窗口按 `Ctrl+C` 即可。

**Q5：第一次运行被系统安全软件拦截？**
SendKeys 属于模拟键鼠操作，部分安全软件可能提示。属正常现象，允许即可；请仅在你信任的环境中运行本脚本。

## 注意事项

- 脚本会真实触发键盘回车，运行期间请勿手动操作键盘鼠标，避免误触；
- 循环任务会持续弹出 WorkBuddy 任务框，运行前确认这是你期望的行为；
- 若不需要 skills 参数，`config.json` 中保持 `"skills": ""` 即可，URL 中会自动省略该参数。
