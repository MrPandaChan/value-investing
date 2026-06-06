# Value Investing 项目二次开发文档

## 一、项目概述

本项目是一个基于 **VitePress** 构建的个人价值投资知识库系统。它将投资研究框架、行业分析、公司研究和量化估值模型整合为静态文档站点，同时内置了完整的数据抓取、处理与估值引擎。

**核心能力：**
- 从新浪财经/东方财富 API 自动抓取 A 股/港股财务数据
- 多维度财务数据处理（10 个维度分析指标）
- 四种估值模型引擎（利润折现、股息率、直接估值、参考估值）
- 价值轮动模型与投资组合管理
- 股票池管理与投资计划制定
- 大量投资知识文档（价值投资理念、行业研究、公司深度分析）

---

## 二、技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 文档框架 | VitePress | ^1.6.4 |
| 前端框架 | Vue 3 (Composition API) | - |
| UI 组件库 | Element Plus | ^2.13.2 |
| 图表库 | ECharts | ^6.0.0 |
| 样式预处理 | Sass (sass-embedded) | ^1.92.1 |
| HTTP 客户端 | Axios | ^1.11.0 |
| Markdown 扩展 | markdown-it + markdown-it-mathjax3 | ^14.1.0 |
| TypeScript 运行时 | tsx | ^4.20.5 |
| 包管理器 | pnpm | - |
| CI/CD | GitHub Actions → GitHub Pages | - |

---

## 三、项目目录结构

```
value-investing/
├── .github/
│   └── workflows/
│       └── deploy.yml                    # GitHub Actions 自动部署配置
├── .vitepress/                           # VitePress 配置与运行时
│   ├── config.mts                        # 站点配置（导航/侧边栏/插件）
│   ├── components/                       # Vue 组件
│   │   ├── portfolio/                    # 持仓组合组件
│   │   ├── rotation-model/               # 价值轮动模型组件
│   │   ├── shared/                       # 通用组件（表格）
│   │   ├── step/                         # 投资步骤组件
│   │   ├── stock-pool/                   # 股票池组件
│   │   ├── table/                        # 财务数据表格组件（11个）
│   │   ├── valuation/                    # 估值组件
│   │   └── value-evaluation/             # 企业价值评估组件
│   ├── service/                          # 核心业务逻辑
│   │   ├── stock.ts                      # Stock 类（核心股票模型）
│   │   ├── profit-valuation.ts           # 利润估值引擎
│   │   ├── dividend-valuation.ts         # 股息估值引擎
│   │   └── data.ts                       # 处理后股票数据集（5.55MB）
│   ├── theme/                            # 自定义主题
│   │   ├── index.ts                      # 主题入口
│   │   ├── custom.scss                   # 自定义布局样式
│   │   └── shared.scss                   # 共享表格样式
│   └── cache/deps/                       # VitePress 依赖缓存
├── fetch-data/                           # 数据抓取模块
│   ├── start-fetch.ts                    # 抓取入口
│   ├── fetch-stock-data.ts               # 从新浪/东方财富 API 抓取数据
│   ├── handle-stock-data.ts              # 数据处理管道（原始→结构化）
│   ├── helper.ts                         # 工具函数集
│   ├── save-data.ts                      # 文件读写工具（JSON/TS）
│   ├── types.ts                          # 数据抓取类型定义
│   ├── load-all-data.ts                  # 加载 data/ 目录下所有 JSON
│   └── update-dynamic-data.ts            # 更新动态行情数据
├── types/                                # 核心类型定义
│   ├── index.ts                          # 所有核心类型的集中定义（295行）
│   ├── stocks.ts                         # 股票池汇总与代码验证
│   └── stocks/                           # 按行业分类的股票配置
│       ├── chinese-spirits.ts            # 白酒
│       ├── home-appliance.ts             # 白电
│       ├── car.ts                        # 汽车
│       ├── electricity.ts                # 电力
│       ├── coal.ts                       # 煤炭
│       ├── operator.ts                   # 运营商
│       ├── oil.ts                        # 石油
│       ├── port.ts                       # 港口
│       ├── chinese-medicine.ts           # 中药
│       ├── bank.ts                       # 银行
│       ├── insurance.ts                  # 保险（内联）
│       ├── internet.ts                   # 互联网
│       ├── dairy.ts                      # 乳制品
│       ├── chemicals.ts                  # 化学制品
│       ├── nonferrous-metals.ts          # 有色金属
│       ├── pesticide.ts                  # 农药
│       ├── advertisement.ts              # 广告传媒
│       ├── beverage.ts                   # 茶饮
│       ├── property.ts                   # 物业
│       └── other.ts                      # 其它（杂项股票）
├── company/                              # 行业与公司分析文档（Markdown）
│   ├── stock-pool/                       # 股票池页面
│   ├── model/                            # 投资模型页面
│   ├── portfolio/                        # 持仓组合页面
│   └── [30+行业目录]/                     # 各行业/公司分析文档
├── value-investing/                      # 投资框架知识库（Markdown）
│   ├── value-investing/                  # 核心投资理念
│   ├── ai/                               # AI 工具与增强系统
│   ├── ai-skill/                         # AI 投资分析提示词模板
│   ├── business/                         # 商业分析（护城河/生意模式/成长空间）
│   ├── cycles/                           # 周期分析
│   ├── valuation/                        # 估值思维
│   ├── governance/                       # 公司治理
│   ├── market/                           # 股票市场（A股/港股）
│   ├── analysis/                         # 操作策略
│   ├── figures-and-cases/                # 投资大师与案例
│   ├── summary/                          # 总结与复盘
│   └── notes/                            # 笔记
├── files/                                # 附加资源文件
├── package.json                          # 项目配置
├── tsconfig.json                         # TypeScript 配置
├── pnpm-lock.yaml                        # 依赖锁定
└── index.md                              # 站点首页
```

---

## 四、核心 API 与类型系统

### 4.1 入口：`types/index.ts`

这是整个项目的类型基石，定义了约 295 行的核心类型。分为以下几大类：

#### 估值配置类型

```typescript
// 估值方法枚举
enum ValuationType {
  DIRECT,     // 直接估值 - 直接给定目标价格
  PROFIT,     // 利润估值 - 基于未来利润折现
  DIVIDEND,   // 股息估值 - 基于目标股息率反推
  REFERENCE   // 心智升级估值 - 参考价（最常用）
}

// 估值风格（每种方法可有4种风格）
enum ValuationStyle {
  SPECIAL_OFFER = "specialOffer",  // 特价
  CONSERVATIVE  = "conservative",  // 保守
  NEUTRAL       = "neutral",       // 中性
  OPTIMISTIC    = "optimistic",    // 乐观
}
```

**每种估值方法的具体配置：**

| 配置类型 | 关键字段 | 说明 |
|----------|----------|------|
| `DirectValuationConfig` | `type: DIRECT`, `price` | 目标价（人民币） |
| `DividendValuationConfig` | `type: DIVIDEND`, `dividendYield` | 目标股息率 |
| `ReferenceValuationConfig` | `type: REFERENCE`, `price` | 参考价（人民币） |
| `ProfitValuationConfig` | `type: PROFIT`, 4种风格 + `backYearsNum` | 利润折现（支持增长率/绝对值） |

#### 股票配置类型

```typescript
enum StockType { A, B, HK }       // 市场类型
enum StockLevel {
  CORE,      // 核心良田
  ROTATION,  // 轮作备田
  MARGIN     // 田边地头区
}

// 基础股票配置
interface BaseStockItem {
  code: string;
  name: string;
  allocation: number;          // 目标仓位比例（如 0.1 = 10%）
  valuationConfig: ValuationConfig;
  level: StockLevel;
}

// A股特有字段
interface AStockItem extends BaseStockItem {
  type: StockType.A;
  sharesPerLot?: number;       // 一手股数（默认100）
  hkMarketConfig?: HKMarketConfig;  // 关联港股配置
  bMarketConfig?: BMarketConfig;    // 关联B股配置
}
```

#### 财务数据结构

系统将原始财务数据整理为 **10 个维度的结构化数据：**

| 接口 | 关键字段 | 用途 |
|------|----------|------|
| `BasicRevenueData` | revenue, netProfit, netProfitMargin, capex, fcf | 营收基本数据 |
| `CostsExpensesData` | grossProfitMargin, various expenses ratio | 成本费用分析 |
| `BalanceData` | totalAssets, equity, interestBearingDebt, goodwill | 资产负债表 |
| `WorkingCapitalData` | wcPerYuanRevenue, receivables, payables | 营运资本 |
| `FixedAssetInvestmentAnalysisData` | fixedAssetsPerYuanRevenue, depreciation | 固定资产投入分析 |
| `ReturnData` | roe, roa, roic（杜邦分析三因子） | 回报率分析 |
| `TurnoverRateData` | totalAssetsDays, inventoryDays, receivablesDays | 周转率 |
| `PrimaryBusinessData` | mainBusinessIncome, mainType, grossProfitRatio | 主营业务 |
| `ValuationHistoryData` | basicEps, dps, dividendRatio, totalSharesOutstanding | 历史分红与EPS |
| `RecentYearData` | netProfit | 最新归母净利润 |

#### 全局数据容器

```typescript
interface ServiceData {
  [code: string]: {
    basicRevenueData: BasicRevenueData[];
    costsExpensesData: CostsExpensesData[];
    balanceData: BalanceData[];
    workingCapitalData: WorkingCapitalData[];
    fixedAssetInvestmentAnalysisData: FixedAssetInvestmentAnalysisData[];
    returnData: ReturnData[];
    turnoverRateData: TurnoverRateData[];
    primaryBusinessData: PrimaryBusinessData[];
    valuationData: ValuationData;
    dynamicData: DynamicData;
    recentYearData: RecentYearData;
  };
}
```

> 该数据存储于 `.vitepress/service/data.ts`（~5.55MB），是前端所有视图的数据源。

---

### 4.2 股票池：`types/stocks.ts`

负责汇总所有行业的股票配置并导出统一的 `stockData` 数组。

**新增股票的标准流程：**

1. 在 `types/stocks/` 下找到对应的行业文件（或将新公司归入已有文件）
2. 添加一个新的 `StockItem` 配置对象
3. 回到 `types/stocks.ts`，导入新数据并加入数组

**示例 - 新增一只白酒股：**

```typescript
// 在 types/stocks/chinese-spirits.ts 中添加
{
  type: StockType.A,
  name: "洋河股份",
  code: "002304",
  level: StockLevel.ROTATION,
  allocation: 0.05,
  valuationConfig: {
    type: ValuationType.REFERENCE,
    price: 80
  }
}
```

`stocks.ts` 中内置了 `validate()` IIFE，会在运行时检查 code 是否重复。`getStockItem(code)` 函数用于按代码查询单只股票。

---

## 五、数据抓取与处理模块

### 5.1 数据流概览

```
新浪财经 / 东方财富 API
        ↓  fetch-stock-data.ts（抓取）
   ./data/{code}.json（原始JSON缓存）
        ↓  handle-stock-data.ts（处理）
.vitepress/service/data.ts（5.55MB 结构化数据）
        ↓  估值引擎 + Vue 组件
      页面渲染（表格/轮动模型/股票池）
```

### 5.2 NPM 脚本命令

| 命令 | 用途 |
|------|------|
| `pnpm fetch-data` | 从 API 抓取所有 A 股的财务数据并缓存为 JSON |
| `pnpm handle-data` | 将缓存的 JSON 处理为 `data.ts` 结构化数据 |
| `pnpm update-dynamic` | 更新动态行情数据（价格/PE/PB/市值） |
| `pnpm update-data` | **一键更新所有数据**（并行执行以上三步） |
| `pnpm force-update` | 强制更新（添加 `-f` 参数跳过缓存检查） |
| `pnpm docs:dev` | 启动 VitePress 开发服务器 |
| `pnpm docs:build` | 生产构建 |
| `pnpm docs:preview` | 预览构建产物 |

### 5.3 `fetch-data/fetch-stock-data.ts` - 数据源

**API 端点：**

| API | 用途 |
|-----|------|
| `quotes.sina.cn/cn/api/openapi.php` | 四大报表：关键指标(gjzb)、资产负债表(fzb)、利润表(lrb)、现金流量表(llb) |
| `datacenter.eastmoney.com` | 主营业务数据、现金流量补充数据、分红历史 |
| `push2.eastmoney.com` | 实时行情：价格、PE_TTM、PB、总市值、总股本 |

**关键函数：**

- `getGjzb(paperCode)` / `getFzb()` / `getLrb()` / `getLlb()` — 四大报表抓取
- `getPrimaryBusinessData(code)` — 主营业务（按行业/产品/地区维度）
- `getCashflow(code)` — 补充现金流量（折旧摊销等）
- `getDividend(code)` — 分红历史记录
- `getDynamicData(codes)` — 批量获取动态行情数据（支持 A/H/B 股）
- `getExchangeRate()` — 人民币/港币汇率
- `fetchAStockData(stockItem)` — 单只 A 股全数据抓取
- `main()` — 遍历 `stockData` 并发抓取（每次间隔 10s 防止限流）

### 5.4 `fetch-data/handle-stock-data.ts` - 数据处理管道

将原始 API 数据转换计算为 10 个维度的结构化财务数据。核心计算逻辑包括：

- **营收分析**：营业收入、归母净利、扣非净利、核心利润、经营现金流、自由现金流（FCF）、CAPEX
- **成本费用**：毛利率、销售费用率、管理/研发费用率、期间费用率
- **资产负债表**：流动资产/非流动资产、商誉、有息/无息负债、资产负债率
- **营运资本**：营运资本需求（WC）计算、应收账款周转、存货周转
- **固定资产分析**：轻资产/重资产判断指标
- **杜邦分析**：ROE = 销售净利率 × 资产周转率 × 权益乘数
- **主营业务**：按行业/产品/地区的收入成本利润占比
- **估值数据**：历史 EPS、每股分红(DPS)、分红率

### 5.5 `fetch-data/helper.ts` - 工具函数

| 函数 | 用途 |
|------|------|
| `toPaperCode(code)` | 转为新浪 paperCode 格式 |
| `toSECUCODE(code)` | 转为东方财富 SECUCODE 格式 |
| `formatDate(year)` | 日期格式化 |
| `formatNum(num, digits)` | 数字格式化 |
| `numToAHundredMillion(val, fixed)` | 原始值转为亿单位 |
| `formatPercent(val)` | 百分比格式化 |
| `calculateDepreciation(cashFlow, period)` | 折旧摊销计算 |
| `presentValue(bal, rate, year)` | 现值折现计算 |
| `annualizedGrowthRate(val, years)` | 年化增长率计算 |
| `stocksToSecIds(codes)` | 股票代码转东方财富 secids 格式 |
| `isHKCode(code)` | 判断是否为港股代码 |
| `v()` | 生成防缓存随机数 |

---

## 六、估值引擎（核心业务逻辑）

### 6.1 Stock 类 — `service/stock.ts`

股票的核心模型类，封装了单只股票的全部计算逻辑。

**构造器：**
```typescript
constructor(
  stockItem: StockItem,           // 股票配置
  dynamicData: DynamicData,        // 动态行情
  exchangeRate: number,            // 汇率
  valuationStyle: ValuationStyle   // 估值风格
)
```

**关键计算属性：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `name` | getter | 股票显示名称（A/B/H 前缀 + 名称） |
| `code` | getter | 股票代码 |
| `price` | computed | 动态股价 |
| `pe` | computed | PETTM |
| `pb` | computed | 市净率 |
| `exchangePrice` | computed | 折算人民币价格（港股/B股按汇率转换） |
| `dividendYield` | computed | 股息率 |
| `dividendPayoutRatio` | getter | 分红率 |
| `loseYield` | computed | 相对锚点的亏损比例 |
| `longTermAverageReturnYield` | computed | 长期平均收益率（锚点/股价/10年） |
| `allocation` | getter | 目标仓位比例 |
| `anchor` | ref | 估值锚点（人民币） |

**关键方法：**

| 方法 | 说明 |
|------|------|
| `calculateAnchor(style)` | 计算估值锚点（选择对应估值引擎） |
| `calculateAllocationShares(totalAmount)` | 计算目标仓位股数 |
| `calculateCollectionRatioShares(totalAmount)` | 计算收集比例股数 |
| `calculateCumulativeRatioShares(totalAmount)` | 计算累计收集股数 |
| `setAllShares(totalAmount)` | 一次性设置所有股数计算 |
| `calculateTheoretical(totalAmount, ratio)` | 计算理论仓位 |
| `updateDynamicData(dynamicData)` | 更新动态行情数据 |

**估值锚点计算逻辑（`calculateAnchor`）：**

```
1. PROFIT 估值 → new ProfitValuation() → anchor.value（只支持A股）
2. DIVIDEND 估值 → new DividendValuation() → anchor
3. DIRECT 估值  → valuationConfig.price（人民币）
4. REFERENCE 估值 → valuationConfig.price（人民币，当前最常用）
```

### 6.2 ProfitValuation 类 — `service/profit-valuation.ts`

基于未来利润增长折现的估值引擎，是系统中最复杂的计算模块。

**核心参数：**
- `DISCOUNT_RATE = 0.04`（折现率，基于"4%法则"）
- `backYearsNum`：回本年限（默认 10 年）

**两种增长推算模式：**
- `ProfitValuationGrowthType.RATE`：按逐年增长率推算
- `ProfitValuationGrowthType.PROFIT`：按各年绝对利润值推算

**关键计算属性：**

| 属性 | 说明 |
|------|------|
| `sumEps` | 合计未来 N 年每股收益（不含折现） |
| `sumPresentEps` | 合计未来 N 年每股收益（含折现） |
| `presetEps` | 折现后年平均 EPS |
| `anchor` | **估值锚点** = sumEps × discount |
| `presentAnchor` | **折现后锚点** = sumPresentEps × discount |
| `otherAssets` | 其他资产每股价值 = (净现金×1 + 交易性金融资产×0.75 + 长期股权投资×0.5 - 少数股东权益) × discount |
| `anchorWithAssets` | 加其他资产的锚点 |
| `battingEdge` | 击球区边缘 = anchor × 1.05 |
| `couldFallAnother` | 还可跌比例 = (price - anchor) / price |
| `longTermAverageReturnYieldWithPrice` | 当前价格下的长期平均收益率 |

**交互式表格数据（`ProfitValuationFutureData`）：**
- 支持在 UI 中直接编辑每年的利润、增长率或 EPS
- 支持联动计算（修改一个字段自动重算相关字段及后续年份）

### 6.3 HKMarketValuation 类

港股/B股估值子模型，在 ProfitValuation 基础上增加汇率与税务调整：

- **汇率转换**：港币→人民币（通过东方财富 CNHHKD 实时汇率）
- **估值折扣**（discount）：港股默认 0.8，B股默认 1（可配置）
- **股息税率**（dividendTaxRate）：港股默认 1（可配置，如 0.8 表示扣 20% 股息税）
- **异步创建**：`HKMarketValuation.create(profitValuation)` 会实时获取港股价格与汇率

### 6.4 DividendValuation 类 — `service/dividend-valuation.ts`

基于目标股息率反推估值的轻量引擎：

```
anchor = 最近一期分红总额 / 目标股息率 / 总股本
```

例如：每股分红 1 元，目标股息率 5%，则 anchor = 1 / 0.05 = 20 元。

---

## 七、前端组件体系

### 7.1 组件目录结构

```
.vitepress/components/
├── shared/
│   └── app-table.vue                  # 通用表格（封装 Element Plus）
├── step/
│   └── step.vue                       # 投资步骤指引组件
├── table/                             # 财务数据表格（11个）
│   ├── basic-revenue-table.vue        # 营收基本数据
│   ├── costs-expenses-table.vue       # 成本费用
│   ├── balance-table.vue              # 资产负债表
│   ├── working-capital-table.vue      # 营运资本
│   ├── fixed-asset-investment-analysis-table.vue
│   ├── return-table.vue               # 回报率（杜邦分析）
│   ├── turnover-rate-table.vue        # 周转率
│   ├── primary-business-table.vue     # 主营业务
│   ├── compare-data-table.vue         # 同行数据对比
│   ├── compare-primary-business-table.vue
│   ├── compare-return-table.vue
│   └── compare-turnover-rate-table.vue
├── valuation/                         # 估值组件
│   ├── profit-valuation.vue           # 利润估值交互界面
│   └── profit-valuation-group.vue     # 利润估值分组视图
├── rotation-model/                    # 价值轮动模型
│   ├── rotation-model.vue             # 主界面
│   ├── stock-row.vue                  # 股票行
│   ├── area-row.vue                   # 区域行（特价区/击球区）
│   ├── table-columns.ts               # 列配置
│   └── types.ts                       # 行类型定义
├── stock-pool/                        # 股票池
│   ├── stock-pool.vue                 # 主界面
│   ├── plan.ts                        # 投资计划数据
│   └── fetch-dividend.ts             # 股息数据抓取
├── portfolio/                         # 持仓组合
│   └── portfolio.vue                 # 透视盈余
└── value-evaluation/
    └── value-evaluation.vue          # 企业价值评估模型
```

### 7.2 轮动模型类型（`rotation-model/types.ts`）

```typescript
enum RowType { STOCK, AREA }           // 行类型：股票 / 区域
enum AreaType { SPECIAL_OFFER, HITTING } // 区域类型：特价区 / 击球区

type TableRow = AreaRowType | Stock;   // 表格行联合类型
```

轮动模型的每一行可能是：
- **Stock 实例**（股票行，显示锚点、股价、期望收益、仓位等）
- **AreaRowType**（区域分割行，标记特价区/击球区边界）

### 7.3 投资计划（`stock-pool/plan.ts`）

定义了买入计划数据结构，支持两种策略：

```typescript
enum PlanType { PRICE, DIVIDEND }

// 价格计划 - 在不同价格档位分批买入
interface PricePlan {
  type: PlanType.PRICE;
  price: { value: number; quantity: number }[];
}

// 股息计划 - 在不同股息率档位分批买入
interface DividendPlan {
  type: PlanType.DIVIDEND;
  dividend: { value: number; quantity: number }[];
}
```

---

## 八、VitePress 配置（`config.mts`）

### 8.1 站点核心配置

```typescript
export default defineConfig({
  title: "Value Investing",
  base: "/value-investing/",     // 部署基路径
  outDir: "docs",                // 构建输出目录
  markdown: {
    breaks: true,                // 支持换行符
    math: true,                  // 支持数学公式（MathJax3）
  },
  lastUpdated: true,             // 显示最后更新时间
});
```

### 8.2 侧边栏结构

配置了两个主要侧边栏：

1. **`/value-investing/`** — 投资框架知识库
   - 待办清单
   - 价值投资（12 个子页面）
   - AI / AI SKILL（11 个提示词模板）
   - 周期 / 政策 / 商业 / 估值 / 公司治理
   - 股票市场 / 操作策略
   - 人物&案例 / 总结 / 笔记

2. **`/company/`** — 行业与公司研究
   - 持仓组合（透视盈余 - 仅开发模式可见）
   - 投资模型（股票池、价值轮动模型）
   - 30+ 行业分类（每个行业下有公司分析文档）

### 8.3 导航栏

| 导航项 | 链接 |
|--------|------|
| 首页 | `/` |
| 投资框架 | `/value-investing/value-investing/information.md` |
| 行业与企业 | `/company/stock-pool/stock-pool.md` |

---

## 九、CI/CD 部署

### 部署流程（`deploy.yml`）

```yaml
触发条件：推送到 feat/cgb 分支
运行环境：ubuntu-latest
Node 版本：22.11.0
pnpm 版本：10.6.3

步骤：
1. 检出代码（完整 Git 历史）
2. 设置 Node.js 环境
3. 安装 pnpm 包管理器
4. pnpm install 安装依赖
5. pnpm docs:build 构建站点
6. 上传构建产物为 Pages Artifact
7. 部署到 GitHub Pages
```

> 注意：`pnpm docs:build` 中 `NODE_ENV=production`，构建时不会渲染"持仓组合"页面（该页面仅在开发模式下可见）。

---

## 十、开发指南

### 10.1 添加新股票并展示其数据

**步骤：**

1. **添加股票配置**（`types/stocks/` 目录下对应行业文件）
   ```typescript
   {
     type: StockType.A,
     name: "例股科技",
     code: "600000",
     level: StockLevel.CORE,
     allocation: 0.1,
     valuationConfig: {
       type: ValuationType.REFERENCE,
       price: 50
     }
   }
   ```

2. **在 `types/stocks.ts` 中注册**（如果新增了行业文件）

3. **抓取财务数据**
   ```bash
   pnpm fetch-data
   ```

4. **处理数据**
   ```bash
   pnpm handle-data
   ```

5. **创建分析文档**（在 `company/` 对应行业目录下创建 `.md` 文件）

6. **更新侧边栏**（在 `config.mts` 中添加导航链接）

### 10.2 添加新的估值方法

1. 在 `types/index.ts` 中定义新的 `ValuationConfig` 接口
2. 将新类型加入 `ValuationConfig` 联合类型
3. 在 `.vitepress/service/` 下创建新的估值类
4. 在 `Stock.calculateAnchor()` 中添加对新估值类型的处理分支

### 10.3 添加新的财务数据表格

1. 在 `fetch-data/handle-stock-data.ts` 中添加数据处理逻辑
2. 在 `types/index.ts` 中定义对应的数据接口
3. 在 `ServiceData` 中添加新字段
4. 在 `.vitepress/components/table/` 下创建对应的 Vue 组件
5. 在分析文档中嵌入该组件

### 10.4 调试注意事项

- `data.ts` 文件达到 5.55MB，VS Code 可能无法直接打开，建议通过程序读取
- 抓取数据时 API 有速率限制，代码中已设置 10 秒间隔
- 港股估值组件 `HKMarketValuation.create()` 在 `docs:build` 时会失败（无法访问网络），已内置 try-catch 保护
- 开发模式下（`NODE_ENV=development`）才会显示"持仓组合"等敏感投资页面

### 10.5 项目依赖关系图

```
types/index.ts  ←── types/stocks.ts  ←── types/stocks/*.ts（股票配置）
       ↓
fetch-data/（数据抓取与处理）
       ↓
.vitepress/service/data.ts（结构化全量数据，~5.55MB）
       ↓
.vitepress/service/stock.ts（Stock 类）
.vitepress/service/profit-valuation.ts（利润估值引擎）
.vitepress/service/dividend-valuation.ts（股息估值引擎）
       ↓
.vitepress/components/（23 个 Vue 组件）
       ↓
.vitepress/config.mts（VitePress 配置）
       ↓
company/ + value-investing/（Markdown 内容页）
       ↓
VitePress 构建 → GitHub Pages 部署
```

---

## 十一、常见问题

### Q: 为什么大部分股票使用 REFERENCE 估值而非 PROFIT 估值？

A: 利润估值需要在 `valuationConfig` 中预设未来各年的增长率，这是一个主观判断。作者当前处于"心智升级"阶段，采用参考价作为过渡方案。在配置文件中可以看到大量被注释掉的 PROFIT 估值配置（带具体增长率数据）。

### Q: 如何切换一只股票的估值风格？

A: 在轮动模型页面中，估值风格可通过 UI 选择（特价/保守/中性/乐观）。在 `Stock` 构造函数中传入 `valuationStyle` 参数即可。

### Q: 港股数据为什么需要特殊处理？

A: 港股价格以港币计价，需要通过实时汇率转换为人民币；同时港股股息通常有 20% 的股息税，在估值时需要扣除。`HKMarketValuation` 类封装了这些特殊逻辑。

### Q: 如何贡献新的行业分析？

A: 在 `company/` 下创建新目录，添加 Markdown 分析文档，然后在 `config.mts` 的侧边栏配置中添加对应条目。

---

> 文档生成日期：2026-06-06
>
> 项目分支：`feat/cgb`
