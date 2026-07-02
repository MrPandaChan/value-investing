# AGENTS.md

## 项目概述

价值投资研究文档站点，基于 VitePress 构建。项目包含行业研究、公司财务数据、投资心得等 Markdown 内容，并通过自定义 Vue 组件展示数据表格和图表。

## 技术栈

- **框架**: VitePress 1.6 + Vue 3.5
- **语言**: TypeScript 5.9（strict 模式）
- **样式**: SCSS（sass-embedded）
- **组件库**: Element Plus 2.13
- **图表**: ECharts 6
- **包管理器**: pnpm
- **数据获取**: tsx 运行 fetch-data 脚本，axios 请求接口

## 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm docs:dev` | 启动开发服务器 |
| `pnpm docs:build` | 构建生产版本 |
| `pnpm docs:preview` | 预览构建结果 |
| `pnpm fetch-data` | 从远程 API 获取财务源数据，保存在 `/data/` 目录 |
| `pnpm handle-data` | 根据源数据生成处理后的展示数据 |
| `pnpm update-data` | 获取财务数据 + 处理数据 + 更新动态数据（用于新增公司） |
| `pnpm force-update` | 强制更新所有数据（财报发布后使用，覆盖已有数据） |
| `pnpm update-dynamic` | 仅更新实时动态数据（股价等高频数据） |

## 项目结构

```
.
├── index.md                    # 首页（home layout）
├── industry/                   # 行业研究文档（按行业/公司分类的 .md）
├── value-investing/            # 投资框架、计划、心得等 .md
├── .vitepress/
│   ├── config.mts              # VitePress 配置（侧边栏/导航/虚拟模块）
│   ├── generate-sidebar.ts     # 根据 industry/ 目录自动生成行业侧边栏
│   ├── generate-value-sidebar.ts # 根据 value-investing/ 目录生成投资框架侧边栏
│   ├── components/             # 自定义 Vue 组件
│   │   ├── shared/             # 通用组件（如 app-table.vue）
│   │   └── stock-pool/         # 股票池相关组件
│   ├── service/                # 服务层
│   └── types/                  # 类型定义
├── types/
│   ├── stocks.ts               # 股票汇总入口
│   └── stocks/                 # 按行业分类的公司配置
├── fetch-data/                 # 数据获取与处理脚本
│   ├── start-fetch.ts          # 入口：获取财务数据
│   ├── handle-stock-data.ts    # 处理财务数据
│   ├── update-dynamic-data.ts  # 更新动态数据
│   └── types.ts                # 数据类型定义
└── package.json
```

## 代码风格

### TypeScript
- **strict 模式**：启用了所有严格类型检查
- `noUncheckedIndexedAccess: true`：索引访问必须处理 undefined
- `exactOptionalPropertyTypes: true`：可选属性不能赋 undefined
- `verbatimModuleSyntax: true`：import 语法必须精确
- 模块解析使用 `Bundler` 模式
- 单引号，不使用分号（项目惯例）

### Vue 组件
- 使用 `<script setup lang="ts">` 语法
- 自定义组件放在 `.vitepress/components/` 下
- 通过 VitePress theme 注册全局组件

### Markdown
- 中文内容使用中文标点
- 启用数学公式支持（mathjax）
- 启用换行符渲染（`breaks: true`）

## 添加新公司的流程

1. 在 `types/stocks/` 对应行业文件中添加公司配置
2. 在 `types/stocks.ts` 中引入新文件
3. 运行 `pnpm update-data` 获取并处理数据
4. 如有新财报，运行 `pnpm force-update` 强制刷新

## 数据流

1. `fetch-data` 脚本通过 axios 从外部 API 获取原始财务数据 → 存入 `/data/`
2. `handle-data` 脚本读取 `/data/` 中的源数据和 `/types/stocks/` 中的配置 → 生成处理后的展示数据
3. VitePress 构建时通过虚拟模块（`virtual:industry-tree`、`virtual:company-files`）注入数据 → Vue 组件渲染表格/图表

## 侧边栏机制

- 侧边栏通过脚本**自动生成**，无需手动配置
- `generate-sidebar.ts` 扫描 `industry/` 目录结构生成行业侧边栏
- `generate-value-sidebar.ts` 扫描 `value-investing/` 目录生成投资框架侧边栏
- 新增/删除 Markdown 文件后，侧边栏会自动更新

## 注意事项

- `/data/` 目录较大且包含敏感财务数据，**不要提交到 Git**
- 不要修改 `.vitepress/cache/` 和 `.vitepress/dist/` 中的文件，它们是自动生成的
- SCSS 样式使用 `sass-embedded`（非 `sass`），确保与 Node 版本兼容
- 跨平台开发使用 `cross-env` 设置环境变量
