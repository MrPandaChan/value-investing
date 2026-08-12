<script setup lang="ts">
import { computed, ref, onMounted, watch } from "vue";
import { useData } from "vitepress";
import MarkdownIt from "markdown-it";
import * as echarts from "echarts";

// 定义表格列的接口
export interface TableColumn {
  key: string;
  title: string;
  formatter?: (value: any, row?: any) => string | number;
  // 单元格合并配置
  merge?: {
    // 是否启用该列的单元格合并
    enable?: boolean;
    // 自定义合并规则函数，返回 {rowspan, colspan} 或 null（不合并）
    custom?: (
      row: any,
      column: TableColumn,
      rowIndex: number,
      columnIndex: number,
    ) => { rowspan: number; colspan: number } | null;
  };
  // 表头单元格合并配置
  _headerMerge?: {
    rowspan?: number;
    colspan?: number;
  };
}

// 数据行自定义合并
// data: [
//   {
//     name: '产品A',
//     _cellMerge: {
//       name: { rowspan: 2, colspan: 1 } // 合并两行
//     }
//   }
// ]

// 定义合并单元格的接口
interface MergeCell {
  rowspan: number;
  colspan: number;
}

// 报告期类型
type ReportPeriod = "latest" | "annual" | "q1" | "q2" | "q3";

// 定义组件的属性
const props = withDefaults(
  defineProps<{
    caption: string;
    data: any[];
    columns: TableColumn[];
    emptyText?: string;
    groupKey?: string;
    defaultSelectedKey?: string;
    description?: string;
    quarterlyData?: any[];
  }>(),
  {
    caption: "",
    data: () => [],
    columns: () => [],
    emptyText: "暂无数据",
  },
);

const reportPeriod = ref<ReportPeriod>("latest");
const isSingleQuarter = ref(false);
const hasQuarterly = computed(() => !!props.quarterlyData?.length);

// ===== 单季度数据转换 =====
// 财务报表数据是累计值（一季报=1-3月，中报=1-6月，三季报=1-9月，年报=1-12月）
// 单季度模式下需要做减法拆分：Q2单季=中报-一季报，Q3单季=三季报-中报，Q4单季=年报-三季报
// 以下字段不参与减法（比率/百分比/资产负债盘点值/周转天数/平均值/已计算的差值）
const SINGLE_QUARTER_SKIP_KEYS = new Set([
  // 比率/百分比
  "netProfitMargin",
  "fcfOverNetProfit",
  "netProfitExcludingNonOvernetProfit",
  "cashFlowFromOperatingOverNetProfit",
  "operatingProfitOverNetProfit",
  "grossProfitMargin",
  "grossProfitMinusNetProfit",
  "sellingExpensesRatio",
  "devExpensesRatio",
  "manageExpensesRatio",
  "devAndManageExpensesRatio",
  "totalOperatingExpensesRatio",
  "interestFreeLiabilitiesOverTotal",
  "interestBearingDebtOverTotal",
  "debtRatio",
  "receivablesToRevenueRatio",
  "prepaymentsToRevenueRatio",
  "inventoryToRevenueRatio",
  "accountsPayableToRevenueRatio",
  "advancesToRevenueRatio",
  "contractLiabilitiesToRevenueRatio",
  "fixedAssetsPerYuanRevenue",
  "longTermOperatingAssetsPerYuanRevenue",
  "depreciationOverRevenue",
  "wcPerYuanRevenue",
  "roe",
  "roa",
  "roic",
  "roce",
  "assetTurnover",
  "equityMultiplier",
  "mbiRatio",
  "mbcRatio",
  "mbpRatio",
  "grossProfitRatio",
  // 周转天数
  "totalAssetsDays",
  "currentAssetsDays",
  "wcDays",
  "receivablesDays",
  "inventoryDays",
  "fixedAssetsDays",
  // 平均值
  "avgTotalAssets",
  "avgCurrentAssets",
  "avgInventory",
  "avgEquity",
  // 资产负债表时点值（非累计）
  "currentAssets",
  "cash",
  "nonCurrentAssets",
  "goodwill",
  "totalAssets",
  "equity",
  "interestFreeLiabilities",
  "interestBearingDebt",
  "interestExpense",
  "receivables",
  "prepayments",
  "accountsPayable",
  "customerAdvances",
  "contractLiabilities",
  "fixedAssets",
  "longTermOperatingAssets",
  "wc",
  // 已计算的差值
  "changeInWC",
  // 非数据字段
  "year",
  "_cellMerge",
  "_isStatRow",
]);

function toSingleQuarter(data: any[]): any[] {
  const sorted = [...data].sort((a, b) =>
    yearSortKey(a.year).localeCompare(yearSortKey(b.year)),
  );
  const result: any[] = [];
  const yearLastEntry = new Map<string, any>();

  for (const item of sorted) {
    const yearPrefix = item.year.match(/^\d{4}/)?.[0] ?? item.year;
    const prev = yearLastEntry.get(yearPrefix);

    if (prev) {
      const sq: any = {};
      for (const key of Object.keys(item)) {
        if (SINGLE_QUARTER_SKIP_KEYS.has(key)) {
          sq[key] = item[key];
        } else if (
          typeof item[key] === "number" &&
          typeof prev[key] === "number"
        ) {
          sq[key] = item[key] - prev[key];
        } else {
          sq[key] = item[key];
        }
      }
      result.push(sq);
    } else {
      // 该年第一个报告期（A股Q1 或 港股中报），保留原值
      result.push({ ...item });
    }

    yearLastEntry.set(yearPrefix, item);
  }

  return result;
}

// ===== 年份/季度排序辅助 =====
function yearSortKey(year: string): string {
  const m = year.match(/^(\d{4})(?:Q(\d))?$/);
  if (!m) return year;
  const q = m[2] || "4";
  return `${m[1]}${q}`;
}

function getYearPrefix(year: string): string {
  return year.match(/^\d{4}/)?.[0] ?? year;
}

const PERIOD_OPTIONS: { value: ReportPeriod; label: string }[] = [
  { value: "latest", label: "最新" },
  { value: "annual", label: "年报" },
  { value: "q1", label: "一季报" },
  { value: "q2", label: "中报" },
  { value: "q3", label: "三季报" },
];

// ===== 当前显示数据 =====
const currentData = computed(() => {
  if (!hasQuarterly.value) return props.data;

  // 抽取年化增速统计行（始终展示，与报告期选择无关）
  const statRows = props.data.filter((v) => v._isStatRow);

  // 年报 + 累计：直接返回原数据（含增速统计行、已排序）
  if (reportPeriod.value === "annual" && !isSingleQuarter.value) {
    return props.data;
  }

  const qt = props.quarterlyData!;
  let result: any[];

  if (reportPeriod.value === "latest") {
    if (isSingleQuarter.value) {
      // 最新 + 单季：全部季度数据拆分为单季
      result = toSingleQuarter(qt);
    } else {
      // 最新 + 累计：每年取最完整的数据
      // 有年报的年份只留年报，无年报的年份保留已有季报
      const yearMap = new Map<string, any[]>();
      for (const item of qt) {
        const y = getYearPrefix(item.year);
        if (!yearMap.has(y)) yearMap.set(y, []);
        yearMap.get(y)!.push(item);
      }
      result = [];
      for (const [, items] of yearMap) {
        const annual = items.find((item) => !item.year.includes("Q"));
        if (annual) {
          result.push(annual);
        } else {
          result.push(...items);
        }
      }
    }
  } else if (reportPeriod.value === "annual") {
    // 年报 + 单季：所有年份 Q1/Q2/Q3/Q4 单季
    result = toSingleQuarter(qt);
  } else if (reportPeriod.value === "q1") {
    result = qt.filter((item) => item.year.includes("Q1"));
    if (isSingleQuarter.value) {
      result = toSingleQuarter(result);
    }
  } else if (reportPeriod.value === "q2") {
    if (isSingleQuarter.value) {
      // 中报 + 单季：需要 Q1+Q2 做减法，展示 Q1、Q2 单季
      result = qt.filter(
        (item) => item.year.includes("Q1") || item.year.includes("Q2"),
      );
      result = toSingleQuarter(result);
    } else {
      result = qt.filter((item) => item.year.includes("Q2"));
    }
  } else if (reportPeriod.value === "q3") {
    if (isSingleQuarter.value) {
      // 三季报 + 单季：需要 Q1+Q2+Q3 做减法，展示 Q1、Q2、Q3 单季
      result = qt.filter(
        (item) =>
          item.year.includes("Q1") ||
          item.year.includes("Q2") ||
          item.year.includes("Q3"),
      );
      result = toSingleQuarter(result);
    } else {
      result = qt.filter((item) => item.year.includes("Q3"));
    }
  } else {
    return props.data;
  }

  // 单季模式下（除"最新"外），保留所有有可用数据的年份
  // 不完整年份有多少展示多少，toSingleQuarter 已正确计算
  if (isSingleQuarter.value && reportPeriod.value !== "latest") {
    // 收集原始 qt 中存在数据的年份（涵盖任何季度或年报）
    const yearsWithData = new Set(qt.map((item) => getYearPrefix(item.year)));
    result = result.filter((item) => {
      const y = getYearPrefix(item.year);
      return yearsWithData.has(y);
    });
  }

  if (result.length === 0) return [];
  // 只保留最近十年数据（统计行不受影响）
  const minYear = new Date().getFullYear() - 10;
  result = result.filter((item) => {
    if (item._isStatRow) return true;
    const y = parseInt(getYearPrefix(item.year));
    return isNaN(y) || y >= minYear;
  });
  // 旧年份在上、新年份在下
  result.sort((a, b) =>
    yearSortKey(a.year).localeCompare(yearSortKey(b.year)),
  );
  // 始终展示年化增速统计行
  return [...result, ...statRows];
});

const md = MarkdownIt({
  html: true,
});

const mdText =
  typeof props.description === "string" ? md.render(props.description) : "";

const showChart = computed(() => {
  if (currentData.value.length === 0) {
    return false;
  }
  return true;
});

// 图表相关逻辑
const chartRef = ref<HTMLElement>();
const chartInstance = ref<echarts.ECharts>();
const { isDark } = useData();
const selectedColumns = ref<string[]>(
  showChart.value && props.defaultSelectedKey
    ? [props.defaultSelectedKey]
    : [props.columns[1].key],
);

// 是否显示非百分比数据的同比变动折线（默认勾选）
const showYoY = ref(true);

// 控制说明弹窗的显示状态
const showDescription = ref(false);

// 初始化图表
onMounted(() => {
  if (chartRef.value) {
    chartInstance.value = echarts.init(chartRef.value);
    updateChart();
  }
});

// 监听数据变化更新图表
watch(
  () => currentData.value,
  () => {
    updateChart();
  },
  { deep: true },
);

// 监听黑夜模式切换
watch(isDark, () => {
  updateChart();
});

// 监听报告期或单季切换
watch([reportPeriod, isSingleQuarter], () => {
  updateChart();
});

// 监听同比变动开关
watch(showYoY, () => {
  updateChart();
});

function groupBy<T extends Record<string, any>, K extends keyof T>(
  array: T[],
  key: K,
): T[][] {
  const resultMap = new Map<T[K], T[]>();

  for (const item of array) {
    const keyValue = item[key];

    if (!resultMap.has(keyValue)) {
      resultMap.set(keyValue, []);
    }

    resultMap.get(keyValue)!.push(item);
  }

  return Array.from(resultMap.values());
}

// 计算上一报告期标签（年度→上年，季度→上年同期），用于同比计算
function prevYearLabel(year: string): string | null {
  const m = year.match(/^(\d{4})(?:Q(\d))?$/);
  if (!m) return null;
  const prevYear = parseInt(m[1], 10) - 1;
  return m[2] ? `${prevYear}Q${m[2]}` : String(prevYear);
}

// 获取某组在指定报告期的原始值：优先当前显示数据，其次回退原始季度数据
// （"最新"模式下上年同期可能被年报替代，需要从 quarterlyData 中找回）
function getRawValue(
  arr: any[],
  yearLabel: string,
  ck: string,
  groupKeyVal?: unknown,
): number | undefined {
  const target = arr.find((v) => v.year === yearLabel);
  if (target && typeof target[ck] === "number") {
    return target[ck];
  }
  if (hasQuarterly.value) {
    const found = props.quarterlyData!.find(
      (v) =>
        v.year === yearLabel &&
        (!props.groupKey || v[props.groupKey] === groupKeyVal),
    );
    if (found && typeof found[ck] === "number") {
      return found[ck];
    }
  }
  return undefined;
}

const group = computed(() => {
  return props.groupKey
    ? groupBy(currentData.value, props.groupKey)
    : [currentData.value];
});

const years = computed(() => {
  const minYear = new Date().getFullYear() - 10;
  return Array.from(
    new Set(
      currentData.value
        .map((item) => item.year)
        .filter((year) => /\d{4}/.test(year)),
    ),
  )
    .filter((y) => parseInt(y) >= minYear)
    .sort((a, b) => yearSortKey(a).localeCompare(yearSortKey(b)));
});

// 单季度季度颜色（深→浅）
const QUARTER_COLORS = ["#1677ff", "#4096ff", "#69b1ff", "#91caff"];

// ===== 单季度嵌套柱图渲染 =====
function renderNestedQuarterChart(colKey: string, column: TableColumn) {
  const chart = chartInstance.value;
  if (!chart) return;

  const dark = isDark.value;
  const qt = props.quarterlyData!;

  // ---- 辅助：格式转换 ----
  function fmtVal(raw: number): number {
    if (!column.formatter) return raw;
    const s = String(column.formatter(raw));
    const n = Number(s.replace(/%/, ""));
    return isNaN(n) ? raw : n;
  }
  function fmtStr(raw: number): string {
    if (!column.formatter) return String(raw);
    return String(column.formatter(raw));
  }

  // ---- 1. 筛选 + 转单季度 ----
  let filtered: any[];
  const rp = reportPeriod.value;
  if (rp === "q1") {
    filtered = toSingleQuarter(qt.filter((item) => item.year.includes("Q1")));
  } else if (rp === "q2") {
    filtered = toSingleQuarter(
      qt.filter((item) => item.year.includes("Q1") || item.year.includes("Q2")),
    );
  } else if (rp === "q3") {
    filtered = toSingleQuarter(
      qt.filter(
        (item) =>
          item.year.includes("Q1") ||
          item.year.includes("Q2") ||
          item.year.includes("Q3"),
      ),
    );
  } else {
    filtered = toSingleQuarter(qt);
  }

  // ---- 2. 剔除目标报告期不存在的年份 ----
  if (rp !== "latest") {
    const suffix: string | null =
      rp === "annual" ? null : rp === "q1" ? "Q1" : rp === "q2" ? "Q2" : "Q3";
    const valid = new Set(
      qt
        .filter((item) =>
          suffix === null
            ? !item.year.includes("Q")
            : item.year.includes(suffix),
        )
        .map((item) => getYearPrefix(item.year)),
    );
    filtered = filtered.filter((item) => valid.has(getYearPrefix(item.year)));
  }

  // ---- 3. 按年份分组：收集 Q1-Q4 单季值 + 年度累计 ----
  const Q_LABELS = ["一季度", "二季度", "三季度", "四季度"];
  const Q_COLORS = QUARTER_COLORS;
  const yearMap = new Map<
    string,
    {
      year: string;
      totalRaw: number;
      totalFmt: number;
      qRaw: (number | null)[];
      qFmt: (number | null)[];
    }
  >();
  for (const item of filtered) {
    const y = getYearPrefix(item.year);
    const m = item.year.match(/Q(\d)/);
    const qi = m ? parseInt(m[1]) - 1 : 3;
    const raw = typeof item[colKey] === "number" ? item[colKey] : 0;
    if (!yearMap.has(y)) {
      yearMap.set(y, {
        year: y,
        totalRaw: 0,
        totalFmt: 0,
        qRaw: [null, null, null, null],
        qFmt: [null, null, null, null],
      });
    }
    const e = yearMap.get(y)!;
    e.qRaw[qi] = raw;
    e.qFmt[qi] = fmtVal(raw);
    e.totalRaw += raw;
    e.totalFmt += e.qFmt[qi] ?? 0;
  }

  // ---- 4. 年份升序 + 裁剪至最近十年 + 当年 ----
  const allYears = [...yearMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, e]) => e);
  const minYear = new Date().getFullYear() - 10;
  const yrList = allYears.filter((e) => parseInt(e.year) >= minYear);
  const yrLabels = yrList.map((e) => e.year);

  // ---- 5. 构建 series：bar 年柱 + pictorialBar 四季度柱 ----
  const series: echarts.SeriesOption[] = [];
  const labelColor = dark ? "#ccc" : "#333";

  // 年柱：bar 底层，barGap: '-100%' 与 pictorialBar 中心对齐
  series.push({
    name: "年度",
    type: "bar",
    data: yrList.map((e) => e.totalFmt),
    barWidth: "80%",
    barGap: "-100%",
    z: 1,
    itemStyle: {
      color: dark ? "rgba(64, 150, 255, 0.12)" : "rgba(24, 144, 255, 0.12)",
      borderColor: dark ? "rgba(64, 150, 255, 0.5)" : "rgba(24, 144, 255, 0.5)",
      borderWidth: 1,
    },
    label: {
      show: true,
      position: "top",
      color: labelColor,
      formatter: (p: any) => (p.value != null ? p.value.toFixed(2) : ""),
    },
    emphasis: {
      itemStyle: {
        color: dark ? "rgba(64, 150, 255, 0.22)" : "rgba(24, 144, 255, 0.22)",
        borderColor: dark
          ? "rgba(64, 150, 255, 0.7)"
          : "rgba(24, 144, 255, 0.7)",
      },
    },
    tooltip: {
      formatter: (p: any) => {
        const idx = allYears.findIndex((x) => x.year === p.name);
        const e = allYears[idx];
        if (!e) return "";
        const prev = allYears[idx - 1];
        const yoy = (cur: number | null, pre: number | null | undefined) => {
          if (cur == null || pre == null || pre === 0) return "";
          const pct = ((cur - pre) / Math.abs(pre)) * 100;
          const sign = pct > 0 ? "+" : "";
          const color =
            pct > 0
              ? dark
                ? "#ff7875"
                : "#cf1322"
              : dark
                ? "#95de64"
                : "#389e0d";
          return ` <span style="color:${color};margin-left:6px;">${sign}${pct.toFixed(3)}%</span>`;
        };
        let html = `<div style="font-weight:bold;margin-bottom:4px;">${p.name}年</div>`;
        html += `<div>年度累计：${fmtStr(e.totalRaw)}${yoy(e.totalRaw, prev?.totalRaw)}</div>`;
        for (let qi = 0; qi < 4; qi++) {
          const v = e.qRaw[qi];
          if (v == null) continue;
          html += `<div><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${Q_COLORS[qi]};margin-right:4px;vertical-align:middle;"></span>${Q_LABELS[qi]}：${fmtStr(v)}${yoy(v, prev?.qRaw?.[qi])}</div>`;
        }
        return html;
      },
    },
  });

  // 季度柱：pictorialBar，紧凑像素宽度
  const qBarW = 10;
  const qGap = 2;
  const qStep = qBarW + qGap;
  const qStart = -((3 * qStep) / 2);
  for (let q = 0; q < 4; q++) {
    const offsetX = qStart + q * qStep;
    series.push({
      name: Q_LABELS[q],
      type: "pictorialBar",
      symbol: "rect",
      symbolSize: [qBarW, "100%"],
      symbolOffset: [offsetX, 0],
      symbolPosition: "start",
      silent: true,
      tooltip: { show: false },
      data: yrList.map((e) => e.qFmt[q]),
      z: 2,
      itemStyle: { color: Q_COLORS[q] },
      label: { show: false },
      animation: false,
      emphasis: { itemStyle: { opacity: 0.85 } },
    });
  }

  // ---- 5.5 年度同比折线（勾选"同比变动"时叠加，保持嵌套柱图原样式） ----
  // 每年折线点 = 当年已披露报告期的累计值 vs 上年同期累计值：
  // 完整年度取全年累计；最新不完整年度（如仅有 2026Q1）取 Q1 值 vs 上年 Q1 值
  if (showYoY.value) {
    // 该年已披露的最高季度索引（单季拆分后完整年度为 3）
    const maxQuarterIdx = (e: { qRaw: (number | null)[] }): number => {
      for (let q = 3; q >= 0; q--) {
        if (e.qRaw[q] != null) return q;
      }
      return -1;
    };
    // 该年从 Q1 到指定季度的单季值之和（即已披露报告期的累计值）
    const cumulativeTo = (
      e: { qRaw: (number | null)[] },
      upTo: number,
    ): number | null => {
      let sum = 0;
      let has = false;
      for (let i = 0; i <= upTo; i++) {
        if (e.qRaw[i] != null) {
          sum += e.qRaw[i]!;
          has = true;
        }
      }
      return has ? sum : null;
    };

    const yoyData = yrList.map((e) => {
      const ai = allYears.findIndex((x) => x.year === e.year);
      const prev = ai > 0 ? allYears[ai - 1] : undefined;
      const qMax = maxQuarterIdx(e);
      if (qMax < 0) return null;
      const cur = cumulativeTo(e, qMax);
      const prevVal = prev ? cumulativeTo(prev, qMax) : null;
      if (cur == null || prevVal == null || prevVal === 0) return null;
      return ((cur - prevVal) / Math.abs(prevVal)) * 100;
    });

    const yoyColor = "#fa8c16";
    series.push({
      name: "年度同比",
      type: "line",
      yAxisIndex: 1,
      data: yoyData,
      showSymbol: true,
      symbolSize: (val: number | null) => (val !== null ? 6 : 0),
      symbol: "circle",
      z: 3,
      itemStyle: { color: yoyColor },
      lineStyle: { width: 2, type: "dashed", color: yoyColor },
      label: {
        show: true,
        position: "top",
        distance: 12,
        color: yoyColor,
        formatter: (params: any) =>
          params.value !== null ? `${params.value.toFixed(1)}%` : "",
      },
      tooltip: {
        formatter: (p: any) => {
          const ai = allYears.findIndex((x) => x.year === p.name);
          const e = ai >= 0 ? allYears[ai] : undefined;
          if (!e) return "";
          const prev = ai > 0 ? allYears[ai - 1] : undefined;
          const qMax = maxQuarterIdx(e);
          const cur = qMax >= 0 ? cumulativeTo(e, qMax) : null;
          const prevVal = prev ? cumulativeTo(prev, qMax) : null;
          const pct =
            cur != null && prevVal != null && prevVal !== 0
              ? ((cur - prevVal) / Math.abs(prevVal)) * 100
              : null;
          if (pct == null) return "";
          const sign = pct > 0 ? "+" : "";
          const color =
            pct > 0
              ? dark
                ? "#ff7875"
                : "#cf1322"
              : dark
                ? "#95de64"
                : "#389e0d";
          return `<div style="font-weight:bold;margin-bottom:4px;">${p.name}年同比</div><div>${sign}${pct.toFixed(2)}%</div>`;
        },
      },
    });
  }

  // ---- 6. option ----
  const textColor = dark ? "#aaa" : "#333";
  const axisColor = dark ? "#555" : "#333";
  const splitColor = dark ? "#444" : "#e0e0e0";
  const tBg = dark ? "rgba(40,40,40,0.95)" : "rgba(255,255,255,0.95)";
  const tBorder = dark ? "#555" : "#ccc";
  const tText = dark ? "#ddd" : "#333";

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: "item",
      enterable: true,
      hideDelay: 200,
      backgroundColor: tBg,
      borderColor: tBorder,
      textStyle: { color: tText },
    },
    grid: {
      left: "3%",
      right: showYoY.value ? "6%" : "4%",
      bottom: "15%",
      containLabel: true,
    },
    legend: { show: false },
    xAxis: {
      type: "category",
      data: yrLabels,
      axisPointer: { type: "shadow" },
      axisLine: { show: true, lineStyle: { width: 1, color: axisColor } },
      axisTick: { show: true, alignWithLabel: true },
      axisLabel: {
        interval: 0,
        rotate: yrLabels.length > 11 ? 30 : 0,
        color: textColor,
      },
    },
    yAxis: [
      {
        type: "value",
        position: "left",
        axisLine: { show: true, lineStyle: { width: 1, color: axisColor } },
        axisTick: { show: true },
        axisLabel: { color: textColor },
        splitLine: { lineStyle: { type: "dashed", color: splitColor } },
      },
      ...(showYoY.value
        ? [
            {
              type: "value",
              position: "right",
              axisLabel: { formatter: "{value}%", color: textColor },
              splitLine: { show: false },
            },
          ]
        : []),
    ],
    series,
  };

  chart.clear();
  chart.setOption(option, true);
}

// 更新图表数据
function updateChart() {
  if (!showChart.value) return;

  if (!chartInstance.value && chartRef.value) {
    chartInstance.value = echarts.init(chartRef.value);
  }

  if (!chartInstance.value) return;

  // 单季度 + 单个绝对值列 → 嵌套柱图
  const colKey = selectedColumns.value[0];
  const column = colKey
    ? props.columns.find((c) => c.key === colKey)
    : undefined;
  const isPercentage =
    column &&
    (/率|\/|比重/.test(column.title) ||
      (colKey &&
        currentData.value.some((v) => v[colKey]?.toString().includes("%"))));
  const isSingleQuarterAbsolute =
    isSingleQuarter.value &&
    !isPercentage &&
    selectedColumns.value.length === 1 &&
    !props.groupKey;

  // 单季度模式始终保留嵌套柱图样式；同比折线在嵌套柱图内按年度口径绘制
  if (isSingleQuarterAbsolute && hasQuarterly.value) {
    renderNestedQuarterChart(colKey!, column!);
    return;
  }

  // ---- 以下是原有图表渲染逻辑 ----
  const dark = isDark.value;
  const series: echarts.SeriesOption[] = [];
  let barCount = 0;

  // 添加选中的列数据
  const yoyNames: string[] = [];
  selectedColumns.value.forEach((ck) => {
    const col = props.columns.find((c) => c.key === ck);
    if (!col) return;

    group.value.forEach((arr) => {
      // 原始值（未格式化），用于计算同比
      const rawValues = years.value.map((year) => {
        const target = arr.find((v) => v.year === year);
        return target ? target[ck] : undefined;
      });

      const values = rawValues.map((val) => {
        if (val === undefined || val === null) return "-";
        if (col.formatter) {
          return col.formatter(val);
        }
        return val;
      });

      const isPct =
        /率|\/|比重/.test(col.title) ||
        values.some((v) => v?.toString().includes("%"));
      const name = props.groupKey
        ? `${col.title}-${arr[0][props.groupKey]}`
        : col.title;
      const data = values.map((v) => {
        if (v === "-") return null;
        return Number(v.toString().replace(/%/, ""));
      });

      const labelColor = dark ? "#ccc" : "#333";

      if (isPct) {
        series.push({
          name,
          type: "line",
          yAxisIndex: 1,
          data,
          showSymbol: true,
          symbolSize: (val) => (val !== null ? 6 : 0),
          symbol: "circle",
          lineStyle: { width: 2 },
          label: {
            show: true,
            position: "top",
            color: labelColor,
            formatter: (params: any) =>
              params.value !== null
                ? params.value > 10
                  ? `${params.value.toFixed(0)}%`
                  : `${params.value}%`
                : "",
          },
        });
      } else {
        barCount += 1;
        series.push({
          name,
          type: "bar",
          yAxisIndex: 0,
          data,
          showBackground: false,
          label: {
            show: true,
            // 勾选同比时移到柱内顶部，避免与折线百分比标签重叠
            position: showYoY.value ? "insideTop" : "top",
            color: showYoY.value ? (dark ? "#e8e8e8" : "#fff") : labelColor,
            formatter: (params: any) =>
              params.value !== null ? params.value.toFixed(2) : "",
          },
        });

        // 勾选"同比变动"时，为非百分比数据添加同比折线
        if (showYoY.value) {
          const groupKeyVal = props.groupKey
            ? arr[0]?.[props.groupKey]
            : undefined;
          const yoyData = rawValues.map((val, idx) => {
            if (typeof val !== "number" || !isFinite(val)) return null;
            const yearLabel = years.value[idx];
            const prevLabel = yearLabel ? prevYearLabel(yearLabel) : null;
            // 最新报告期（如 2026Q1）在显示数据中可能没有上年同期（被上年年报替代），
            // 回退到原始季度数据查找，保证最新数据也有同比
            const prev = prevLabel
              ? getRawValue(arr, prevLabel, ck, groupKeyVal)
              : undefined;
            if (typeof prev !== "number" || !isFinite(prev) || prev === 0) {
              return null;
            }
            return ((val - prev) / Math.abs(prev)) * 100;
          });
          const yoyName = `${name}同比`;
          yoyNames.push(yoyName);
          series.push({
            name: yoyName,
            type: "line",
            yAxisIndex: 1,
            data: yoyData,
            showSymbol: true,
            symbolSize: (val: number | null) => (val !== null ? 6 : 0),
            symbol: "circle",
            itemStyle: { color: "#fa8c16" },
            lineStyle: { width: 2, type: "dashed", color: "#fa8c16" },
            label: {
              show: true,
              position: "top",
              distance: 10,
              color: "#fa8c16",
              formatter: (params: any) =>
                params.value !== null ? `${params.value.toFixed(1)}%` : "",
            },
          });
        }
      }
    });
  });

  let barWidthPercent = 85;
  if (barCount > 0) {
    barWidthPercent = (0.85 / barCount) * 100;
  }
  if (barWidthPercent > 40) {
    barWidthPercent = 40;
  }

  const textColor = dark ? "#aaa" : "#333";
  const axisColor = dark ? "#555" : "#333";
  const splitColor = dark ? "#444" : "#e0e0e0";
  const tooltipBg = dark ? "rgba(40,40,40,0.95)" : "rgba(255,255,255,0.95)";
  const tooltipBorder = dark ? "#555" : "#ccc";
  const tooltipText = dark ? "#ddd" : "#333";

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: "axis",
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      textStyle: { color: tooltipText },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      containLabel: true,
    },
    legend: {
      data: (() => {
        const legendData = selectedColumns.value.reduce(
          (pre: string[], colKey) => {
            const title =
              props.columns.find((c) => c.key === colKey)?.title || colKey;
            if (props.groupKey) {
              return pre.concat(
                group.value.map((v) => `${title}-${v[0][props.groupKey!]}`),
              );
            }
            pre.push(title);
            return pre;
          },
          [],
        );
        if (showYoY.value) legendData.push(...yoyNames);
        return legendData;
      })(),
      selected: Object.fromEntries(
        selectedColumns.value.map((colKey) => [colKey, true]),
      ),
      top: "bottom",
      padding: [10, 0, 0, 0],
      textStyle: { color: textColor },
    },
    xAxis: {
      type: "category",
      data: years.value,
      axisPointer: {
        type: "shadow",
      },
      axisLine: {
        show: true,
        lineStyle: { width: 1, color: axisColor },
      },
      axisTick: {
        show: true,
        alignWithLabel: true,
      },
      axisLabel: {
        interval: 0,
        rotate: years.value.length > 11 ? 30 : 0,
        color: textColor,
      },
    },
    yAxis: [
      {
        type: "value",
        name: "",
        position: "left",
        axisLine: {
          show: true,
          lineStyle: { width: 1, color: axisColor },
        },
        axisTick: {
          show: true,
        },
        axisLabel: { color: textColor },
        splitLine: {
          lineStyle: { type: "dashed", color: splitColor },
        },
      },
      {
        type: "value",
        name: "",
        position: "right",
        axisLabel: {
          formatter: "{value}%",
          color: textColor,
        },
        splitLine: {
          show: false,
        },
      },
    ],
    series: series.map((s) => ({
      ...s,
      barWidth: `${barWidthPercent}%`,
      barGap: "10%",
      barCategoryGap: "20%",
    })),
  };

  chartInstance.value?.clear();
  chartInstance.value?.setOption(option, true);
}

// 处理列点击事件
function handleColumnClick(columnKey: string) {
  const index = selectedColumns.value.indexOf(columnKey);
  if (index === -1) {
    selectedColumns.value.push(columnKey);
  } else {
    selectedColumns.value.splice(index, 1);
  }
  updateChart();
}

// 判断数据是否为空
const isEmpty = computed(
  () => !currentData.value || currentData.value.length === 0,
);

// 计算单元格合并属性
const getMergeCellAttrs = (
  row: any,
  column: TableColumn,
  rowIndex: number,
  columnIndex: number,
): MergeCell | null => {
  // 1. 首先检查行数据中是否有针对该列的合并单元格配置（最高优先级）
  if (row._cellMerge && row._cellMerge[column.key]) {
    return row._cellMerge[column.key];
  }

  // 2. 如果列没有配置合并或者未启用合并，返回null
  if (!column.merge || !column.merge.enable) {
    return null;
  }

  // 3. 如果有自定义合并规则，使用自定义规则
  if (column.merge.custom) {
    return column.merge.custom(row, column, rowIndex, columnIndex);
  }

  // 4. 默认合并规则：相同值的连续单元格合并
  const currentValue = row[column.key];

  // 如果是第一行或者当前值与上一行不同
  if (
    rowIndex === 0 ||
    currentData.value[rowIndex - 1][column.key] !== currentValue
  ) {
    // 计算当前值连续出现的次数
    let count = 1;
    for (let i = rowIndex + 1; i < currentData.value.length; i++) {
      if (currentData.value[i][column.key] === currentValue) {
        count++;
      } else {
        break;
      }
    }

    // 如果有连续相同的值，设置rowspan
    if (count > 1) {
      return { rowspan: count, colspan: 1 };
    }
  }
  // 如果当前值与上一行相同，则该单元格不显示（rowspan=0）
  else {
    return { rowspan: 0, colspan: 0 };
  }

  return null;
};

// 判断单元格是否需要渲染
const shouldRenderCell = (
  row: any,
  column: TableColumn,
  rowIndex: number,
  columnIndex: number,
): boolean => {
  const mergeAttrs = getMergeCellAttrs(row, column, rowIndex, columnIndex);
  // 如果rowspan和colspan都为0，则不渲染该单元格
  return !(mergeAttrs && mergeAttrs.rowspan === 0 && mergeAttrs.colspan === 0);
};

// 获取单元格的值
const getCellValue = (row: any, column: TableColumn) => {
  const value = row[column.key];

  // 如果是统计行且不是年份列，直接返回值，不应用formatter
  if (row._isStatRow && column.key !== "year") {
    return isNaN(value) ? "-" : value.toFixed(2) + "%";
  }

  if (column.formatter) {
    return column.formatter(value, row);
  }
  return value ?? "-";
};

// 处理表格标题，最多显示两行，并且两行字数尽量平衡
const formatColumnTitle = (title: string) => {
  // 如果标题为空或长度小于等于4，直接返回
  if (!title || title.length <= 4) return title;

  // 尝试在标点符号或空格处分割
  const punctuationMatch = title.match(/[,，.。、/:：;；!！?？\s]/);

  if (
    punctuationMatch &&
    punctuationMatch.index &&
    punctuationMatch.index > 1 &&
    punctuationMatch.index < title.length - 2
  ) {
    // 在标点符号处分割，确保两行字数相对平衡
    const splitIndex = punctuationMatch.index + 1;
    const firstLine = title.substring(0, splitIndex);
    0;
    const secondLine = title.substring(splitIndex);

    // 如果分割后两行字数差距太大，则使用中点分割
    if (Math.abs(firstLine.length - secondLine.length) > title.length / 3) {
      const midPoint = Math.ceil(title.length / 2);
      return `<span style="white-space: nowrap;">${title.substring(
        0,
        midPoint,
      )}</span><br><span style="white-space: nowrap;">${title.substring(
        midPoint,
      )}</span>`;
    }

    return `<span style="white-space: nowrap;">${firstLine}</span><br><span style="white-space: nowrap;">${secondLine}</span>`;
  }

  // 如果没有合适的标点符号，则在中点附近寻找合适的汉字分割点
  const midPoint = Math.ceil(title.length / 2);

  // 尝试在中文词语边界处分割（避免在词语中间断开）
  // 这里简单处理，实际中文分词可能需要更复杂的算法
  let adjustedMidPoint = midPoint;

  // 如果标题长度大于6，尝试在中点附近找到更合适的分割点
  if (title.length > 6) {
    // 在中点前后2个字符范围内寻找更合适的分割点
    for (let i = 1; i <= 2; i++) {
      if (midPoint - i >= 1) {
        adjustedMidPoint = midPoint - i;
        break;
      }
      if (midPoint + i <= title.length - 1) {
        adjustedMidPoint = midPoint + i;
        break;
      }
    }
  }

  return `<span style="white-space: nowrap;">${title.substring(
    0,
    adjustedMidPoint,
  )}</span><br><span style="white-space: nowrap;">${title.substring(
    adjustedMidPoint,
  )}</span>`;
};
</script>

<template>
  <div class="chart-container" ref="chartRef" v-if="showChart"></div>
  <div class="table-header-bar" v-if="hasQuarterly || showChart">
    <div class="header-controls">
      <label class="single-quarter-check" v-if="hasQuarterly">
        <input type="checkbox" v-model="isSingleQuarter" />
        <span>单季度</span>
      </label>
      <select
        v-if="hasQuarterly"
        class="period-select"
        v-model="reportPeriod"
      >
        <option
          v-for="opt in PERIOD_OPTIONS"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
      <el-checkbox v-if="showChart" v-model="showYoY" size="small">
        同比变动
      </el-checkbox>
    </div>
    <div class="single-quarter-notice" v-if="isSingleQuarter">
      利润表/现金流已拆分为单季度（累计减法）；资产负债表为期末时点值，比率/周转指标不做拆分。
    </div>
  </div>
  <table>
    <caption v-if="caption || description">
      <div class="caption-wrapper">
        <span>{{ caption }}</span>
        <span
          v-if="description"
          class="help-icon"
          @click="showDescription = true"
          title="查看说明"
        >
          ?
        </span>
      </div>
    </caption>
    <thead>
      <tr>
        <template v-for="(column, columnIndex) in columns" :key="column.key">
          <th
            v-if="!column._headerMerge || column._headerMerge.rowspan !== 0"
            :rowspan="column._headerMerge?.rowspan || 1"
            :colspan="column._headerMerge?.colspan || 1"
            @click="handleColumnClick(column.key)"
            :class="{ 'selected-column': selectedColumns.includes(column.key) }"
          >
            <span v-html="formatColumnTitle(column.title)"></span>
          </th>
        </template>
      </tr>
    </thead>
    <tbody>
      <template v-if="!isEmpty">
        <tr v-for="(row, rowIndex) in currentData" :key="rowIndex">
          <template v-for="(column, columnIndex) in columns" :key="column.key">
            <td
              v-if="shouldRenderCell(row, column, rowIndex, columnIndex)"
              :rowspan="
                getMergeCellAttrs(row, column, rowIndex, columnIndex)
                  ?.rowspan || 1
              "
              :colspan="
                getMergeCellAttrs(row, column, rowIndex, columnIndex)
                  ?.colspan || 1
              "
            >
              {{ getCellValue(row, column) }}
            </td>
          </template>
        </tr>
      </template>
      <tr v-else>
        <td :colspan="columns.length">
          {{ emptyText }}
        </td>
      </tr>
    </tbody>
  </table>

  <!-- 说明弹窗 -->
  <div
    v-if="showDescription"
    class="description-overlay"
    @click="showDescription = false"
  >
    <div class="description-modal" @click.stop>
      <div class="description-header">
        <h3>分析方法</h3>
        <button class="close-btn" @click="showDescription = false">×</button>
      </div>
      <div class="description-content vp-doc" v-html="mdText"></div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.chart-container {
  width: 100%;
  height: 300px;
  margin-bottom: 20px;
}

.table-header-bar {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 12px;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;

  :deep(.el-checkbox) {
    margin-right: 0;
    font-size: 13px;
  }
}

// 单季度复选框
.single-quarter-check {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  user-select: none;
  white-space: nowrap;

  input[type="checkbox"] {
    width: 14px;
    height: 14px;
    accent-color: #1890ff;
    cursor: pointer;
  }
}

// 报告期下拉菜单
.period-select {
  padding: 4px 28px 4px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23999'/%3E%3C/svg%3E")
    no-repeat right 8px center;
  background-size: 10px 6px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  appearance: none;
  outline: none;
  transition: border-color 0.2s;

  &:hover {
    border-color: #1890ff;
  }

  &:focus {
    border-color: #1890ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.15);
  }
}

// 单季提示
.single-quarter-notice {
  font-size: 11px;
  color: #bbb;
  line-height: 1.4;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  margin-bottom: 20px;
}

caption {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 8px;
  text-align: center;
  caption-side: top;
}

.caption-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background-color: #e6f7ff;
  color: #1890ff;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #bae7ff;
    transform: scale(1.1);
  }
}

th {
  font-weight: 600;
  padding: 2px 4px;
  line-height: 1.2;
  text-align: center;
}

td {
  padding: 2px 4px;
  line-height: 32px;
  white-space: nowrap;
  text-align: center;
}

// 根据表格大小调整样式
:deep(.core-profit-table--small) {
  th,
  td {
    height: 28px;
    line-height: 28px;
    font-size: 13px;
  }
}

:deep(.core-profit-table--large) {
  th,
  td {
    height: 44px;
    line-height: 44px;
    font-size: 15px;
  }
}

// 确保表格内容垂直居中
th span,
td span {
  display: inline-block;
  vertical-align: middle;
  line-height: normal;
}

// 选中列的样式
th.selected-column {
  background-color: #f0f7ff;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background-color: #1890ff;
  }
}

// 说明弹窗样式
.description-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 1000;
  padding-top: 10vh;
}

.description-modal {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 600px;
  max-width: 1080px;
  max-height: calc(85vh);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  margin-top: 0;
  animation: slideDown 0.2s ease-out;
}

.description-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #262626;
  }
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #8c8c8c;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f5f5f5;
    color: #262626;
  }
}

.description-content {
  padding: 0 20px;
  overflow-y: auto;
  // 确保内容区域有足够的内边距
  padding: 20px;
}

// 弹窗滑入动画
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// ===== 黑夜模式适配 =====
html.dark {
  .single-quarter-notice {
    color: #777;
  }

  .single-quarter-check {
    color: #aaa;

    input[type="checkbox"] {
      accent-color: #4096ff;
    }
  }

  .period-select {
    border-color: #555;
    background-color: #1e1e1e;
    color: #ccc;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E");

    &:hover {
      border-color: #4096ff;
    }

    &:focus {
      border-color: #4096ff;
      box-shadow: 0 0 0 2px rgba(64, 150, 255, 0.2);
    }
  }
  th.selected-column {
    background-color: #1a2a3a;
    &::after {
      background-color: #4096ff;
    }
  }

  .help-icon {
    background-color: #1a2a3a;
    color: #4096ff;

    &:hover {
      background-color: #253545;
    }
  }

  .description-modal {
    background: #1e1e1e;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  }

  .description-header {
    border-bottom-color: #333;

    h3 {
      color: #ddd;
    }
  }

  .close-btn {
    color: #888;

    &:hover {
      background-color: #333;
      color: #ddd;
    }
  }

  .description-content {
    color: #ccc;
  }
}
</style>
