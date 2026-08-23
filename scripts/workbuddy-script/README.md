# WorkBuddy 任务自动发送脚本（生意全景队列版 · 并行）

通过 `workbuddy://` 协议自动打开 WorkBuddy 新建任务框，把任务内容填入任务框，等待数秒后自动触发回车键发送任务。

> **重要：需要管理员权限运行。**
> WorkBuddy 以管理员权限运行（Electron 多进程，`tasklist /v` 显示 User Name 为 N/A、低权限进程无法打开其 Token）。
> 若脚本以普通权限运行，Windows 的 **UIPI 特权隔离**会静默拦截脚本模拟的键盘输入（SendKeys/SendWait），
> 导致"prompt 已填入但回车不生效"——手动回车则正常。
> `run-loop.bat` / `run-once.bat` 已内置自动提权逻辑（检测到非管理员时弹 UAC 请求提权），请使用 bat 启动脚本。

本版本支持**并行任务队列**：
- 以 `tasks.json` 为**唯一状态源**，每次循环重新读取，任务状态直接反映在文件中；
- 任务状态机：`pending → running → done / failed`，各任务独立维护 `attempts` / `last_sent`；
- **并行机制**：最多同时运行 `max_concurrent` 个任务（默认 3），每 `send_interval_seconds` 秒（默认 60）发送一个新任务；
- 自动轮询输出文件，确认完成后再补位发送，全部任务结束自动退出。

## 目录结构

```
workbuddy-task-runner/
├── config.json          # 配置文件（发送延迟、并发、轮询、超时等）
├── tasks.json           # 任务队列（状态源，脚本会写回状态）
├── prompt.md            # prompt 模板（含 {TASK_NAME} 等占位符）
├── once-test.ps1        # 一次性测试脚本（发送第一个 pending 任务）
├── task-loop.ps1        # 主循环脚本（并行队列推进）
├── run-once.bat         # 双击运行一次性测试
├── run-loop.bat         # 双击运行队列任务
├── lib/
│   └── build-task-url.ps1  # 公共函数库：构造 URL + 模拟回车
└── task-loop.log        # 循环运行日志（自动生成）
```

## tasks.json 字段说明

| 字段 | 说明 |
|------|------|
| `id` | 任务编号（发送顺序按 id 升序） |
| `name` | 生意名称（如"白酒"） |
| `target` | 分析对象描述（注入 prompt，分析立场要求客观中立、不以单一公司为中心） |
| `output` | 输出文件相对路径（相对工作区根） |
| `status` | `pending` 待处理 / `running` 处理中 / `done` 已完成 / `failed` 失败 |
| `attempts` | 已发送次数（含重发） |
| `last_sent` | 最近一次发送时间（ISO 格式），用于超时计算 |

> 你可以**手动编辑 tasks.json** 控制任务：把 `status` 改为 `done` 可跳过；把 `failed` 改回 `pending` 可重新排队。脚本每次循环都会重新读取文件。

## 并行机制说明

- **并发上限**：同一时刻最多 `max_concurrent`（默认 3）个任务处于 `running`；
- **发送节拍**：每 `send_interval_seconds`（默认 60）秒才允许发送一个新的任务，避免一次性灌入过多任务；
- **完成检测**：每个 `running` 任务的输出文件存在、大小 ≥ `min_file_bytes`、**内容包含完成标记 `completion_marker`**（默认 `47. 最终洞见与哲学反思`，因任务是逐部分输出，只有写到最后一个模块才算完成）、且连续 `stable_checks` 次轮询大小不变，才标记 `done` 释放槽位；
- **超时重试**：以 `max(last_sent, 输出文件最后写入时间)` 为基准，超过 `task_timeout_minutes` 无进展才自动重发（`attempts` 递增）；只要文件仍在持续写入（逐部分输出），就不断重置计时，避免误重发；超过 `max_retries` 次标记 `failed`；
- 全部任务进入 `done` / `failed` 后脚本自动退出。

## 快速开始

### 第 1 步：检查 tasks.json

确认任务清单中的 `name` / `target` / `output` / `status`。港口等已完成任务标记为 `done`，脚本会跳过。

### 第 2 步：一次性测试

双击 `run-once.bat`（或 `powershell -ExecutionPolicy Bypass -File once-test.ps1`）。
脚本会取第一个 `pending` 任务，将其标记为 `running` 并写回，然后构造 prompt 并发送，可用来验证协议是否正常。

### 第 3 步：启动自动队列

双击 `run-loop.bat`。脚本会按状态机推进：依次发送 pending 任务（受并发与节拍约束），轮询输出文件，完成后补位，全部结束退出。

## 配置说明（config.json）

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `enter_delay_seconds` | `8` | 打开 WorkBuddy 后等待多久再按回车（秒） |
| `app_name` | `""` | 发送回车前尝试激活的窗口名（回退用）。脚本会**优先按进程 ID 激活 WorkBuddy 主窗口**（Electron 多进程，主进程才有 MainWindowHandle），更可靠；`app_name` 仅在找不到主进程时作为回退 |
| `send_key` | `"~"` | 发送的按键。`~` 表示回车（SendKeys 语法，兼容性最好），可改为 `"^{ENTER}"`（Ctrl+Enter）等 WorkBuddy 支持的快捷键 |
| `send_repeat` | `1` | 每次任务发送时按 Enter 的次数（默认 1 次，回车只发一次） |
| `skills` | `""` | 传入 URL 的 skills 参数，不需要则留空 |
| `cwd` | 工作区根 | 传入 URL 的 cwd 参数（WorkBuddy 工作目录） |
| `tasks_file` | `tasks.json` | 任务队列文件（状态源） |
| `prompt_template` | `prompt.md` | prompt 模板文件 |
| `framework_file` | `value-investing/AI赋能投资/生意拆解.md` | 拆解框架文件（相对工作区根） |
| `output_root` | 工作区根 | 输出文件绝对路径的根目录 |
| `poll_seconds` | `30` | 轮询输出文件的间隔（秒） |
| `send_interval_seconds` | `60` | 发送新任务的最小间隔（秒，节拍） |
| `max_concurrent` | `3` | 同时运行的任务上限 |
| `task_timeout_minutes` | `120` | 单个任务超时（分钟），超时后重发 |
| `max_retries` | `2` | 单个任务最大重发次数 |
| `min_file_bytes` | `5000` | 判定输出文件有效的最小大小（字节） |
| `stable_checks` | `3` | 连续 N 次轮询文件大小不变才判定稳定完成 |
| `completion_marker` | `50. 核心指标仪表盘` | 输出文件内容必须包含的完成标记（逐部分输出的最后一个模块） |

## prompt.md 占位符

| 占位符 | 说明 |
|--------|------|
| `{TASK_NAME}` | 生意名称 |
| `{ANALYSIS_TARGET}` | 分析对象描述 |
| `{OUTPUT_FILE}` | 输出文件绝对路径 |
| `{FRAMEWORK_FILE}` | 拆解框架文件绝对路径 |
| `{DATA_DATE}` | 发送日期（yyyy-MM-dd） |

> prompt.md 已内置"分析立场"要求：分析对象是**生意本身**而非单一公司，禁止以特定公司作为分析锚点，公司仅作示例/对比材料。这是避免单一公司干扰行业判断的关键约束。

## 补充任务模式（为已有分析追加第十一部分 第48–50节）

当前 `prompt.md` 已切换为**补充任务模板**：不再重新生成第1–47节，而是读取已有输出文件、在原文末尾追加第48–50节（一页纸回顾卡 / 复习题 / 核心指标仪表盘）。

- **前提**：输出文件必须已包含完整的第1–47节（即旧任务标记为 `done`）。
- **配置差异**：`completion_marker` 必须为 `50. 核心指标仪表盘`（最后一个新增模块），否则原文件已含 `47. 最终洞见与哲学反思` 会被误判为"已完成"，导致任务秒过而不补充。
- **tasks.json**：把要补充的行业 `status` 改为 `pending`、`attempts` 改为 `0`，脚本会重新排队发送。
- **运行方式**：与完整拆解完全相同——双击 `run-loop.bat`（或先 `run-once.bat` 测试单个任务）。
- **恢复完整拆解**：若之后想再次做完整拆解任务，需把 `prompt.md` 换回原始完整模板，并恢复 `completion_marker` 为 `47. 最终洞见与哲学反思`。

## 工作原理

1. 读取 `config.json`，循环开始前校验 tasks.json / prompt 模板 / 框架文件存在；
2. 每轮重新读取 `tasks.json`（状态源在磁盘）；
3. 发送任务前**预创建输出文件（空文件）**——任务一发送，目标文件就存在，便于区分"任务未开始"与"任务进行中"；
4. 检查所有 `running` 任务的输出文件：内容包含完成标记 → `done`；超时无进展 → 重发 / `failed`；
5. 若 `running` 数 < `max_concurrent` 且距上次发送 ≥ `send_interval_seconds`，取下一个 `pending` 任务，标记 `running` 写回后发送；
6. 全部任务结束自动退出。

## 常见问题

**Q1：回车没有生效 / 任务没有发送？**
- 确认 WorkBuddy 已登录且能正常接收 `workbuddy://` 协议；
- 把 `enter_delay_seconds` 调大，等窗口完全弹出；
- 确认以管理员权限运行脚本（见文首提示）：WorkBuddy 是管理员进程时，普通权限脚本的模拟键盘会被系统拦截，导致回车无效。

**Q2：如何跳过/重新排队某个任务？**
在 `tasks.json` 中把该任务 `status` 改为 `done`（跳过）或 `pending`（重新排队）。脚本每次循环都会重新读取。

**Q3：任务卡在 running 但实际没在跑？**
可能是脚本中途停止过。可把该任务 `status` 改回 `pending` 重新排队，或等待超时后自动重发。

**Q4：如何停止循环任务？**
在运行 `run-loop.bat` 的窗口按 `Ctrl+C` 即可。已 `running` 的任务保留状态，重启后会继续跟踪。

**Q5：prompt 里有中文会乱码吗？**
不会。脚本显式以 UTF-8 读取 `prompt.md`、`tasks.json` 和 `config.json`，URL 编码后交给协议处理。

**Q6：第一次运行被系统安全软件拦截？**
SendKeys 属于模拟键鼠操作，部分安全软件可能提示。属正常现象，允许即可；请仅在你信任的环境中运行本脚本。

## 注意事项

- 脚本会真实触发键盘回车，运行期间请勿手动操作键盘鼠标，避免误触；
- 循环任务会持续弹出 WorkBuddy 任务框，运行前确认这是你期望的行为；
- **不要同时运行两个 task-loop 实例**，否则两个进程都会读写 tasks.json，可能导致重复发送；
- 每个任务发送时会预创建（或复用）`output` 指定的文件；若文件已存在则不覆盖，WorkBuddy 写入时覆盖更新；
- 输出文件判定为"完成"的依据是：内容包含完成标记（`47. 最终洞见与哲学反思`）+ 大小超过阈值 + 连续 `stable_checks` 次轮询大小不变。空文件是正常状态（表示任务已发送、尚未开始写入），会继续等待。
