<script lang="ts" setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import * as echarts from "echarts";
import { useData } from "vitepress";
import { formatNum, formatPercent } from "../../../fetch-data/helper";
import {
  computeEpsCagr,
  usePortfolioHistory,
  type CompanyHistory,
} from "./use-portfolio-history";
import StockPoolPortfolio from "./portfolio.vue";

const range = ref(10);

/** 收益率/权重分母是否包含现金（现金不产生透视盈余，默认不含） */
const includeCash = ref(false);

/** 实时透视盈余弹窗（与投资计划页同一个组件） */
const portfolioDialogVisible = ref(false);

const {
  companies,
  missingCompanies,
  missingEquityCompanies,
  cashAndEtf,
  rows,
  latestRow,
  cagr,
  holdings,
  totalHoldingValue,
  isLoading,
  refresh,
  loadFromStorage,
} = usePortfolioHistory(range, includeCash);

const { isDark } = useData();

/** 表格按年度降序展示（最新在上），图表仍按升序 */
const displayRows = computed(() => [...rows.value].reverse());

const years = computed(() => rows.value.map((row) => row.year));

const sortedCompanies = computed(() =>
  [...companies.value].sort((a, b) => {
    if (a.hasData !== b.hasData) return a.hasData ? -1 : 1;
    return b.weight - a.weight;
  }),
);

const missingWeight = computed(() =>
  missingCompanies.value.reduce((sum, company) => sum + company.weight, 0),
);

/** 按当前市值的最新年度股息率 */
const latestDividendYield = computed(() => {
  const latest = latestRow.value;
  if (!latest || totalHoldingValue.value <= 0) return null;
  return latest.dividend / totalHoldingValue.value;
});

/** 金额按万元展示（组合规模为百万级，用亿元会丢失精度） */
function wan(value: number): string {
  if (!Number.isFinite(value)) return "-";
  return (value / 1e4).toFixed(2);
}

function pct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "-";
  return formatPercent(value * 100);
}

function epsText(company: CompanyHistory, year: string): string {
  const eps = company.epsByYear[year];
  if (eps == null) return "-";
  return formatNum(eps, 2).toFixed(2);
}

/** 按当前展示区间计算 EPS 年化增速，末年亏损单独标注 */
function epsCagrText(company: CompanyHistory): string {
  const result = computeEpsCagr(company.epsByYear, years.value);
  if (result.latestLoss) return "末年亏损";
  return pct(result.value);
}

function priceText(price: number): string {
  if (!Number.isFinite(price) || price <= 0) return "-";
  return formatNum(price, 3).toFixed(3);
}

/** 该公司在最新年度的应占净利润占组合应占净利润的比例 */
function latestContribution(company: CompanyHistory): string {
  const latest = latestRow.value;
  if (!latest || latest.profit <= 0) return "-";
  const value = company.profitByYear[latest.year];
  if (value == null) return "-";
  return pct(value / latest.profit);
}

// ===== 图表 =====
const earningsChartRef = ref<HTMLElement | null>(null);
const dividendChartRef = ref<HTMLElement | null>(null);
let earningsChart: echarts.ECharts | null = null;
let dividendChart: echarts.ECharts | null = null;

function themeColors() {
  const dark = isDark.value;
  return {
    dark,
    textColor: dark ? "#aaa" : "#333",
    axisColor: dark ? "#555" : "#333",
    splitColor: dark ? "#444" : "#e0e0e0",
    tooltipBg: dark ? "rgba(40,40,40,0.95)" : "rgba(255,255,255,0.95)",
    tooltipBorder: dark ? "#555" : "#ccc",
    tooltipText: dark ? "#ddd" : "#333",
  };
}

function updateEarningsChart() {
  if (!earningsChartRef.value || !rows.value.length) return;
  if (!earningsChart) earningsChart = echarts.init(earningsChartRef.value);

  const colors = themeColors();
  const labels = rows.value.map((row) => row.year);
  const surplus = rows.value.map((row) =>
    Number((row.surplus / 1e4).toFixed(2)),
  );
  const roe = rows.value.map((row) =>
    row.roe == null ? null : Number((row.roe * 100).toFixed(2)),
  );

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: "axis",
      backgroundColor: colors.tooltipBg,
      borderColor: colors.tooltipBorder,
      textStyle: { color: colors.tooltipText },
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params];
        const row = rows.value[list[0]?.dataIndex ?? 0];
        if (!row) return "";
        return [
          `<b>${row.year}</b>`,
          `透视盈余：${wan(row.surplus)} 万`,
          `应占净利润：${wan(row.profit)} 万`,
          `应占净资产：${wan(row.equity)} 万`,
          `组合 ROE：${pct(row.roe)}`,
          `数据覆盖：${pct(row.coveredWeight)}`,
        ].join("<br/>");
      },
    },
    legend: {
      top: 0,
      data: ["透视盈余", "组合 ROE"],
      textStyle: { color: colors.textColor },
    },
    grid: {
      left: "3%",
      right: "4%",
      top: 44,
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { color: colors.textColor },
      axisLine: { lineStyle: { color: colors.axisColor } },
    },
    yAxis: [
      {
        type: "value",
        name: "万元",
        nameTextStyle: { color: colors.textColor },
        axisLabel: { color: colors.textColor },
        splitLine: {
          lineStyle: { color: colors.splitColor, type: "dashed" },
        },
      },
      {
        type: "value",
        name: "%",
        position: "right",
        nameTextStyle: { color: colors.textColor },
        axisLabel: { formatter: "{value}%", color: colors.textColor },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: "透视盈余",
        type: "bar",
        data: surplus,
        barMaxWidth: 42,
        itemStyle: {
          color: colors.dark ? "#a05510" : "#f88920",
          borderRadius: [3, 3, 0, 0],
        },
      },
      {
        name: "组合 ROE",
        type: "line",
        yAxisIndex: 1,
        data: roe,
        connectNulls: true,
        smooth: true,
        symbolSize: 6,
        lineStyle: { width: 2, color: colors.dark ? "#88bbff" : "#2972f4" },
        itemStyle: { color: colors.dark ? "#88bbff" : "#2972f4" },
      },
    ],
  };

  earningsChart.setOption(option, true);
}

function updateDividendChart() {
  if (!dividendChartRef.value || !rows.value.length) return;
  if (!dividendChart) dividendChart = echarts.init(dividendChartRef.value);

  const colors = themeColors();
  const labels = rows.value.map((row) => row.year);
  const dividend = rows.value.map((row) =>
    Number((row.dividend / 1e4).toFixed(2)),
  );
  const payout = rows.value.map((row) =>
    row.payoutRatio == null ? null : Number((row.payoutRatio * 100).toFixed(2)),
  );

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: "axis",
      backgroundColor: colors.tooltipBg,
      borderColor: colors.tooltipBorder,
      textStyle: { color: colors.tooltipText },
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params];
        const row = rows.value[list[0]?.dataIndex ?? 0];
        if (!row) return "";
        const yieldText =
          totalHoldingValue.value > 0
            ? pct(row.dividend / totalHoldingValue.value)
            : "-";
        return [
          `<b>${row.year}</b>`,
          `应占股息：${wan(row.dividend)} 万`,
          `股息税：${wan(row.tax)} 万`,
          `留存利润：${wan(row.retained)} 万`,
          `分红率（税前）：${pct(row.payoutRatio)}`,
          `股息率（按当前市值）：${yieldText}`,
        ].join("<br/>");
      },
    },
    legend: {
      top: 0,
      data: ["应占股息", "分红率(税前)"],
      textStyle: { color: colors.textColor },
    },
    grid: {
      left: "3%",
      right: "4%",
      top: 44,
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { color: colors.textColor },
      axisLine: { lineStyle: { color: colors.axisColor } },
    },
    yAxis: [
      {
        type: "value",
        name: "万元",
        nameTextStyle: { color: colors.textColor },
        axisLabel: { color: colors.textColor },
        splitLine: {
          lineStyle: { color: colors.splitColor, type: "dashed" },
        },
      },
      {
        type: "value",
        name: "%",
        position: "right",
        nameTextStyle: { color: colors.textColor },
        axisLabel: { formatter: "{value}%", color: colors.textColor },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: "应占股息",
        type: "bar",
        data: dividend,
        barMaxWidth: 42,
        itemStyle: {
          color: colors.dark ? "#3f8f4f" : "#2e9e5b",
          borderRadius: [3, 3, 0, 0],
        },
      },
      {
        name: "分红率(税前)",
        type: "line",
        yAxisIndex: 1,
        data: payout,
        connectNulls: true,
        smooth: true,
        symbolSize: 6,
        lineStyle: { width: 2, color: colors.dark ? "#ffb860" : "#d48806" },
        itemStyle: { color: colors.dark ? "#ffb860" : "#d48806" },
      },
    ],
  };

  dividendChart.setOption(option, true);
}

function updateCharts() {
  updateEarningsChart();
  updateDividendChart();
}

function resizeCharts() {
  earningsChart?.resize();
  dividendChart?.resize();
}

onMounted(async () => {
  loadFromStorage();
  try {
    await refresh();
  } catch {
    // 行情获取失败时沿用本地缓存，页面降级展示
  }
  await nextTick();
  updateCharts();
  window.addEventListener("resize", resizeCharts);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeCharts);
  earningsChart?.dispose();
  earningsChart = null;
  dividendChart?.dispose();
  dividendChart = null;
});

watch(
  [rows, isDark],
  () => {
    nextTick(updateCharts);
  },
  { deep: true },
);
</script>

<template>
  <div class="portfolio-history">
    <div class="ph-toolbar">
      <el-radio-group v-model="range" size="small">
        <el-radio-button :value="5">近 5 年</el-radio-button>
        <el-radio-button :value="10">近 10 年</el-radio-button>
      </el-radio-group>
      <el-button
        type="primary"
        size="small"
        :loading="isLoading"
        @click="refresh"
        >刷新行情</el-button
      >
      <el-button
        type="primary"
        size="small"
        @click="portfolioDialogVisible = true"
        >透视盈余</el-button
      >
      <el-switch
        v-model="includeCash"
        size="small"
        active-text="计入现金"
        inactive-text="不计现金"
      />
      <span class="ph-meta">
        {{ includeCash ? "当前总资产" : "股票持仓市值" }}：￥{{
          formatNum(totalHoldingValue, 2).toFixed(2)
        }}
      </span>
    </div>

    <div v-if="!holdings.length" class="ph-empty">
      暂无持仓数据，请先点击「刷新行情」获取价格与权重。
    </div>

    <template v-else>
      <div v-if="rows.length" class="ph-charts">
        <div class="ph-chart-block">
          <div class="ph-chart-title">透视盈余与 ROE</div>
          <div ref="earningsChartRef" class="ph-chart"></div>
        </div>
        <div class="ph-chart-block">
          <div class="ph-chart-title">股息与分红率</div>
          <div ref="dividendChartRef" class="ph-chart"></div>
        </div>
      </div>

      <div v-if="latestRow" class="ph-summary">
        <span>
          最新年度（{{ latestRow.year }}）透视盈余
          <b>{{ wan(latestRow.surplus) }} 万元</b>
        </span>
        <span>
          组合 ROE
          <b>{{ pct(latestRow.roe) }}</b>
        </span>
        <span>
          {{ rows.length }} 个年度复合增速
          <b>{{ pct(cagr) }}</b>
        </span>
        <span class="ph-summary-market">
          按当前市值：收益率
          <b>{{ pct(latestRow.surplusYield) }}</b
          >（PE
          {{
            latestRow.impliedPE == null ? "-" : latestRow.impliedPE.toFixed(2)
          }}）｜股息率
          <b>{{ pct(latestDividendYield) }}</b>
        </span>
      </div>

      <table class="history-table">
        <caption>
          组合透视盈余与 ROE 历史（按当前持仓回溯，金额单位：万元）
        </caption>
        <thead>
          <tr>
            <th>年度</th>
            <th class="bold">透视盈余</th>
            <th>同比</th>
            <th>应占净资产</th>
            <th class="bold">组合 ROE</th>
            <th>应占股息</th>
            <th>股息税</th>
            <th>留存利润</th>
            <th>分红率(税前)</th>
            <th>数据覆盖</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in displayRows" :key="row.year">
            <td class="bold">{{ row.year }}</td>
            <td class="bold surplus">{{ wan(row.surplus) }}</td>
            <td :class="row.yoy == null ? '' : row.yoy >= 0 ? 'red' : 'green'">
              {{ pct(row.yoy) }}
            </td>
            <td>{{ wan(row.equity) }}</td>
            <td class="bold yield">{{ pct(row.roe) }}</td>
            <td>{{ wan(row.dividend) }}</td>
            <td>{{ wan(row.tax) }}</td>
            <td>{{ wan(row.retained) }}</td>
            <td>{{ pct(row.payoutRatio) }}</td>
            <td>{{ pct(row.coveredWeight) }}</td>
          </tr>
        </tbody>
      </table>

      <p class="ph-note">
        透视盈余 = 应占净利润 - 股息税；组合 ROE = 应占净利润 /
        应占归母净资产（期末口径，仅统计净资产数据可得的公司）。<b
          >分红率（税前）</b
        >
        = 应占股息 /
        应占净利润，采用公司宣告的分红总额，未扣股息税（股息税属于投资者层面），税后到手
        = 应占股息 − 股息税。<b>数据覆盖</b> = 该年度有财报数据的持仓市值 /
        当前分母；ETF 与现金不产生盈余，因此分母包含它们时覆盖会低于
        100%。「按当前市值」的收益率、PE、股息率是估值快照，用今天的市值衡量最新年度数据，不代表历史回报。
      </p>

      <table class="history-table company-table">
        <caption>
          分股历史业绩（EPS 按最新年报总股本折算，单位：元/股）
        </caption>
        <thead>
          <tr>
            <th>序号</th>
            <th class="bold">公司</th>
            <th>行业</th>
            <th class="bold">权重</th>
            <th v-for="year in years" :key="year">{{ year }}</th>
            <th>EPS 增速(年化)</th>
            <th>盈余占比</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(company, index) in sortedCompanies" :key="company.code">
            <td>{{ index + 1 }}</td>
            <td class="bold">{{ company.name }}</td>
            <td>{{ company.industry }}</td>
            <td class="bold">{{ pct(company.weight) }}</td>
            <td v-for="year in years" :key="year">
              {{ epsText(company, year) }}
            </td>
            <td>{{ epsCagrText(company) }}</td>
            <td>{{ latestContribution(company) }}</td>
          </tr>
        </tbody>
      </table>

      <p class="ph-note">
        权重 = 持有市值占比；盈余占比 = 该公司最新年度应占净利润 /
        组合应占净利润。两者差异反映估值高低：盈余占比高于权重，说明其市盈率低于组合平均。EPS
        增速为当前选中区间首末年度的年化复合增速（CAGR）；末年亏损时无法计算，显示「末年亏损」。
      </p>

      <table v-if="cashAndEtf.length" class="history-table snapshot-table">
        <caption>
          ETF 与现金（无财报，不参与透视盈余，当前快照）
        </caption>
        <thead>
          <tr>
            <th class="bold">名称</th>
            <th>持有股数</th>
            <th>现价</th>
            <th>持有市值</th>
            <th class="bold">权重</th>
            <th>近 12 个月分红</th>
            <th>股息率</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in cashAndEtf" :key="item.code">
            <td class="bold">{{ item.name }}</td>
            <td>{{ item.isCash ? "-" : item.sharesHeld }}</td>
            <td>{{ item.isCash ? "-" : priceText(item.price) }}</td>
            <td>￥{{ formatNum(item.holdingValue, 2).toFixed(2) }}</td>
            <td class="bold">{{ pct(item.weight) }}</td>
            <td>
              {{ item.isCash ? "-" : formatNum(item.dividend, 2).toFixed(2) }}
            </td>
            <td>{{ item.isCash ? "-" : pct(item.dividendYield) }}</td>
            <td>{{ item.isCash ? "已计入分母" : "无财报，不参与盈余" }}</td>
          </tr>
        </tbody>
      </table>

      <p v-if="missingCompanies.length" class="ph-note">
        无历史数据：{{
          missingCompanies.map((c) => c.name).join("、")
        }}（合计权重 {{ pct(missingWeight) }}），该部分仅计入分母，不计入盈余。
      </p>

      <p v-if="missingEquityCompanies.length" class="ph-note">
        无净资产 / ROE 数据：{{
          missingEquityCompanies.map((c) => c.name).join("、")
        }}，不参与组合 ROE 计算（应占净资产与 ROE 的分子分母同源）。
      </p>
    </template>

    <el-dialog
      v-model="portfolioDialogVisible"
      title="透视盈余"
      width="80%"
      top="2vh"
      destroy-on-close
      class="history-portfolio-dialog"
    >
      <StockPoolPortfolio />
    </el-dialog>
  </div>
</template>

<style lang="scss">
.portfolio-history {
  --ph-text: #000;
  --ph-bg: var(--vp-c-bg);
  --ph-border: #000;
  --ph-surplus: #ffcac8;
  --ph-yield: #9adeff;
}

html.dark .portfolio-history {
  --ph-text: var(--vp-c-text-1);
  --ph-bg: var(--vp-c-bg);
  --ph-border: var(--vp-c-divider);
  --ph-surplus: #4a3030;
  --ph-yield: #2a455a;
}

.history-portfolio-dialog {
  .el-dialog__body {
    max-height: 88vh;
    overflow: auto;
  }
}
</style>

<style lang="scss" scoped>
.portfolio-history {
  .ph-toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 12px;
  }

  .ph-meta {
    font-size: 13px;
    color: var(--ph-text);
    opacity: 0.75;
  }

  .ph-empty {
    padding: 24px 0;
    font-size: 13px;
    color: var(--ph-text);
    opacity: 0.7;
  }

  .ph-charts {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 12px;

    @media (max-width: 900px) {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .ph-chart-block {
    min-width: 0;
  }

  .ph-chart-title {
    font-size: 13px;
    font-weight: bold;
    color: var(--ph-text);
    margin-bottom: 4px;
  }

  .ph-chart {
    width: 100%;
    height: 300px;
  }

  .ph-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 24px;
    font-size: 13px;
    color: var(--ph-text);
    margin-bottom: 8px;

    b {
      font-weight: bold;
    }
  }

  .history-table {
    border-collapse: collapse;
    border-spacing: 0;
    width: 100%;
    font-size: 13px;
    color: var(--ph-text);
    margin-top: 8px;

    caption {
      caption-side: top;
      text-align: left;
      font-size: 14px;
      font-weight: bold;
      padding: 6px 0;
      color: var(--ph-text);
    }

    th,
    td {
      line-height: 22px;
      white-space: nowrap;
      padding: 3px 6px;
      color: var(--ph-text);
      font-weight: normal;
      border: 1px solid var(--ph-border);
      text-align: center;
      vertical-align: top;
      background-color: var(--ph-bg);
    }

    thead th {
      padding: 6px 8px;
    }

    tbody tr:first-child td {
      border-top-width: 0;
    }

    .bold {
      font-weight: bold;
    }

    .surplus {
      background-color: var(--ph-surplus);
    }

    .yield {
      background-color: var(--ph-yield);
    }
  }

  .company-table,
  .snapshot-table {
    margin-top: 16px;
  }

  .ph-summary-market {
    opacity: 0.75;
  }

  .red {
    color: #ff0000;
  }

  .green {
    color: #00b050;
  }

  .ph-note {
    font-size: 12px;
    line-height: 1.7;
    color: var(--ph-text);
    opacity: 0.7;
    margin: 8px 0 0;
  }
}

html.dark .portfolio-history {
  .red {
    color: #ff8888;
  }

  .green {
    color: #66ee66;
  }
}

/* vp-doc 默认表格样式会覆盖边框，这里显式还原 */
.vp-doc .portfolio-history table.history-table {
  display: table;
  margin: 8px 0 0;
}
</style>
