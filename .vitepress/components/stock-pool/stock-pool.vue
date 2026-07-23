<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { CaretTop, CaretBottom, WarningFilled } from "@element-plus/icons-vue";
import {
  formatNum,
  formatPercent,
  canConvertToCNY,
  getCurrencyPrefix,
  isBCode,
  isHKCode,
} from "../../../fetch-data/helper";
import {
  useStockPoolData,
  computeStrikePriceInfo,
  type RowData,
  type StrikePriceInfo,
} from "./use-stock-pool-data";
import { buildExDisplay, type ExDisplayInfo } from "./use-dividend-status";
import { getEffectiveEventDps, type ExItem } from "./fetch-dividend";
import { stocks } from "../../my-data/stock-pool";
import StockPoolPortfolio from "./portfolio.vue";

// ========== 分红状态判断（已拆分至 use-dividend-status.ts） ==========

// 指数代码列表（提前定义，因为 useStockPoolData 需要在一次请求中合并获取）
const INDEX_CODE_LIST = [
  "1.000985",
  "1.000001",
  "0.399001",
  "100.HSI",
  "124.HSTECH",
  "1.000922",
  "0.399006",
  "1.000688",
  "0.399371",
  "0.399370",
  "1.000016",
  "0.399850",
  "1.000300",
  "1.000905",
  "1.000852",
];

const {
  tableData,
  groupMetaMap,
  customPrice,
  customDividend,
  customPE,
  exchangeRate,
  indexDataMap,
  isLoading,
  dividendUpdateTime,
  dynamicUpdateTime,
  init: initShared,
  refresh: refreshShared,
  loadFromStorage,
} = useStockPoolData(INDEX_CODE_LIST);

const portfolioDialogVisible = ref(false);

interface MergedRowData extends RowData {
  nameRowSpan: number;
  exDateRowSpan: number;
  dpsRowSpan: number;
  annualDpsRowSpan: number;
  sharesHeldRowSpan: number;
  remarkRowSpan: number;
  maxPositionRatioRowSpan: number;
  strikePriceRowSpan: number;
  annualDps: number;
  adjustedAnnualDps?: number;
  isFirstRow: boolean;
  isLastRow: boolean;
  decline: number;
  totalMarketCap?: number;
  rowKey: string;
  exListDisplay: ExDisplayInfo[];
  strikePriceInfo?: StrikePriceInfo;
}

// 编辑缓冲：input 绑定到这些 buffer，仅 blur 时同步到 custom*
const editPrice = reactive<Record<string, number>>({});
const editDividend = reactive<Record<string, number>>({});
const editPE = reactive<Record<string, number>>({});
type SortKey =
  | "dividend"
  | "pe"
  | "decline"
  | "exDate"
  | "change"
  | "deviation";

const marketFilter = ref<string[]>([]); // 市场筛选：空数组表示全部
const industryFilter = ref<string[]>([]); // 行业筛选：空数组表示全部
const zoneFilter = ref<string[]>([]); // 分区筛选：空数组表示全部

const ZONE_OPTIONS = [
  { label: "险地区", value: "danger" },
  { label: "平庸区", value: "mediocre" },
  { label: "观察区", value: "observe" },
  { label: "核心价值区", value: "core" },
  { label: "超额溢价区", value: "premium" },
];
const sortConfig = ref<{ key: SortKey; order: "asc" | "desc" }>({
  key: "decline",
  order: "asc",
});

// code → industry 映射表
const industryMap = computed(() => {
  const map: Record<string, string> = {};
  for (const s of stocks) {
    map[s.code] = s.industry;
  }
  return map;
});

// code → qualityScore 映射表
const qualityScoreMap = computed(() => {
  const map: Record<string, number> = {};
  for (const s of stocks) {
    map[s.code] = s.qualityScore;
  }
  return map;
});

// 行业选项（去重排序）
const industryOptions = computed(() => {
  const industries = new Set(stocks.map((s) => s.industry).filter(Boolean));
  return Array.from(industries).sort();
});

interface IndexData {
  code: string;
  label: string;
  price: number;
  change: number;
}

// 第一组：其他市场/主题指数
const INDEX_CODES_GROUP1: { code: string; label: string }[] = [
  { code: "1.000985", label: "中证全指" },
  { code: "1.000001", label: "上证指数" },
  { code: "0.399001", label: "深证成指" },
  { code: "100.HSI", label: "恒生指数" },
  { code: "124.HSTECH", label: "恒生科技指数" },
  { code: "1.000922", label: "中证红利" },
  { code: "0.399006", label: "创业板指" },
  { code: "1.000688", label: "科创50" },
  { code: "0.399371", label: "国证价值" },
  { code: "0.399370", label: "国证成长" },
];

// 第二组：宽基指数（上证50 → 中证2000）
const INDEX_CODES_GROUP2: { code: string; label: string }[] = [
  { code: "1.000016", label: "上证50" },
  { code: "0.399850", label: "深证50" },
  { code: "1.000300", label: "沪深300" },
  { code: "1.000905", label: "中证500" },
  { code: "1.000852", label: "中证1000" },
];

// 合并数组：供视图展示
const INDEX_CODES: { code: string; label: string }[] = [
  ...INDEX_CODES_GROUP1,
  ...INDEX_CODES_GROUP2,
];

// 基于 composable 中一次请求获取的 indexDataMap 构建展示数据
const indexList = computed<IndexData[]>(() =>
  INDEX_CODES.map((item) => {
    const d = indexDataMap.value[item.code];
    return {
      code: item.code,
      label: item.label,
      price: d ? d.price : 0,
      change: d ? d.change : 0,
    };
  }),
);

// 按组拆分
const group1Labels = new Set(INDEX_CODES_GROUP1.map((v) => v.label));
const group2Labels = new Set(INDEX_CODES_GROUP2.map((v) => v.label));
const indexListGroup1 = computed(() =>
  indexList.value.filter((v: IndexData) => group1Labels.has(v.label)),
);
const indexListGroup2 = computed(() =>
  indexList.value.filter((v: IndexData) => group2Labels.has(v.label)),
);

const MARKET_FILTER_STORAGE_KEY = "stock-pool-market-filter";

onMounted(() => {
  loadFromStorage();
  refresh();
  // 加载持久化的市场筛选
  const savedFilter = localStorage.getItem(MARKET_FILTER_STORAGE_KEY);
  if (savedFilter) {
    try {
      const arr: string[] = JSON.parse(savedFilter);
      if (Array.isArray(arr)) marketFilter.value = arr;
    } catch {
      // ignore
    }
  }
  // 加载持久化的分区筛选
  const savedZoneFilter = localStorage.getItem(ZONE_FILTER_STORAGE_KEY);
  if (savedZoneFilter) {
    try {
      const arr: string[] = JSON.parse(savedZoneFilter);
      if (Array.isArray(arr)) zoneFilter.value = arr;
    } catch {
      // ignore
    }
  }
});

// custom* 变化时同步编辑缓冲区（持久化由 composable 统一处理）
watch(
  [customPrice, customDividend, customPE],
  () => {
    syncAllEdits();
  },
  { deep: true },
);

const ZONE_FILTER_STORAGE_KEY = "stock-pool-zone-filter";

watch(
  marketFilter,
  (val) => {
    localStorage.setItem(MARKET_FILTER_STORAGE_KEY, JSON.stringify(val));
  },
  { deep: true },
);

watch(
  zoneFilter,
  (val) => {
    localStorage.setItem(ZONE_FILTER_STORAGE_KEY, JSON.stringify(val));
  },
  { deep: true },
);

async function refresh() {
  try {
    await refreshShared();
  } catch {
    ElMessage.error("行情数据刷新失败，请检查网络后重试");
  }
}

async function init() {
  try {
    await initShared();
  } catch {
    ElMessage.error("分红数据获取失败，请检查网络后重试");
  }
}

function formatPrice(price: number, code: string): string {
  const prefix = getCurrencyPrefix(code);
  return `${prefix}${formatNum(price, 2).toFixed(2)}`;
}

/** 格式化市值（单位:亿），直接以亿为单位显示 */
function formatMarketCap(marketValue: number, code: string): string {
  const prefix = getCurrencyPrefix(code);
  return `${prefix}${formatNum(marketValue, 0)}亿`;
}

/** 港股名称后加 H 标识 */
function displayName(name: string, code: string): string {
  return isHKCode(code) ? `${name}H` : name;
}

/** 将日期字符串的年份部分取后两位，如 "2025-07-16" → "25-07-16" */
function formatShortExDate(dateStr: string): string {
  if (!dateStr || dateStr === "-") return dateStr;
  return dateStr.replace(/^\d{2}(\d{2})/, "$1");
}

/**
 * 根据偏离值返回分区 key（用于筛选和配色）
 */
function getDeviationZoneKey(deviation: number): string {
  if (deviation >= 45) return "danger";
  if (deviation >= 20) return "mediocre";
  if (deviation >= 10) return "observe";
  if (deviation >= -20) return "core";
  return "premium";
}

/**
 * 根据偏离值返回分区 CSS 类名（用于分层配色）
 */
function getDeviationZoneClass(deviation: number): string {
  return `zone-${getDeviationZoneKey(deviation)}`;
}

/**
 * 根据偏离值返回分区描述标签
 */
function getDeviationLabel(deviation: number): string {
  if (deviation >= 60) return "险地区4";
  if (deviation >= 55) return "险地区3：30%";
  if (deviation >= 50) return "险地区2：30%";
  if (deviation >= 45) return "险地区1：30%";
  if (deviation >= 35) return "平庸区2：轮动";
  if (deviation >= 20) return "平庸区1：持有";
  if (deviation >= 15) return "观察1：5%";
  if (deviation >= 10) return "观察2：5%";
  if (deviation >= 5) return "核心价值1：10%";
  if (deviation >= 0) return "核心价值2：10%";
  if (deviation >= -5) return "核心价值3：15%";
  if (deviation >= -10) return "核心价值4：15%";
  if (deviation >= -15) return "核心价值5：15%";
  if (deviation >= -20) return "核心价值5：15%";
  return "超额溢价区：15%";
}

const UPCOMING_LABEL: Record<string, string> = {
  upcoming_urgent: "距除权仅剩",
  upcoming_soon: "距除权还有",
  upcoming_close: "距除权还有",
};

/** 生成除权日 hover 提示文本 */
function getExTitle(ex: ExDisplayInfo): string {
  if (ex.isPredicted) {
    const datePart = formatShortExDate(ex.exDate).slice(2);
    const daysPart =
      ex.daysUntilEx !== null && ex.daysUntilEx > 0
        ? `距预测日 ${ex.daysUntilEx} 天`
        : "预测日已过";
    return `预测下次约 ${datePart}（基于去年），${daysPart}`;
  }

  const label = UPCOMING_LABEL[ex.status];
  if (label && ex.daysUntilEx !== null) {
    return `${label} ${ex.daysUntilEx} 天`;
  }

  switch (ex.status) {
    case "paid":
      return `已除权 ${ex.exDate}`;
    case "past_year":
      return "往期分红";
    case "unknown":
      return "日期未定";
    default:
      return `待分红 ${ex.exDate}`;
  }
}

// 将 custom* 的值同步到编辑缓冲区
function syncEditFromCustom(code: string) {
  if (customPrice[code] !== undefined) editPrice[code] = customPrice[code];
  if (customDividend[code] !== undefined)
    editDividend[code] = customDividend[code];
  if (customPE[code] !== undefined) editPE[code] = customPE[code];
}

// 同步所有 code 的编辑缓冲区
function syncAllEdits() {
  for (const code of Object.keys(customPrice)) {
    syncEditFromCustom(code);
  }
}

function onPriceChange(code: string) {
  const meta = groupMetaMap.value[code];
  const price = customPrice[code];
  if (meta && price > 0) {
    customDividend[code] = meta.effectiveDps / price;
    customPE[code] = meta.pricePE * (price / meta.realPrice);
  }
}

function onPriceBlur(code: string) {
  customPrice[code] = editPrice[code];
  onPriceChange(code);
  syncEditFromCustom(code);
}

function onDividendChange(code: string) {
  const meta = groupMetaMap.value[code];
  const dividend = customDividend[code];
  if (meta && dividend > 0) {
    customPrice[code] = meta.effectiveDps / dividend;
    customPE[code] = meta.pricePE * (customPrice[code] / meta.realPrice);
  }
}

function onDividendBlur(code: string) {
  customDividend[code] = editDividend[code];
  onDividendChange(code);
  syncEditFromCustom(code);
}

function onPEChange(code: string) {
  const meta = groupMetaMap.value[code];
  const pe = customPE[code];
  if (meta && pe > 0) {
    customPrice[code] = meta.realPrice * (pe / meta.pricePE);
    customDividend[code] = meta.effectiveDps / customPrice[code];
  }
}

function onPEBlur(code: string) {
  customPE[code] = editPE[code];
  onPEChange(code);
  syncEditFromCustom(code);
}

function handleSort(key: SortKey) {
  if (sortConfig.value.key === key) {
    sortConfig.value = {
      key,
      order: sortConfig.value.order === "asc" ? "desc" : "asc",
    };
  } else {
    sortConfig.value = { key, order: "asc" };
  }
}

function getSortActive(key: SortKey, order: "asc" | "desc"): boolean {
  return sortConfig.value.key === key && sortConfig.value.order === order;
}

// 按 code 分组，为 name 和 code 列计算 rowspan，并按最小跌幅排序
const mergedTableData = computed(() => {
  const result: MergedRowData[] = [];
  const data = tableData.value;

  // 第一步：收集所有公司分组
  const groups: { code: string; rows: MergedRowData[] }[] = [];

  let i = 0;
  while (i < data.length) {
    const code = data[i].code;
    const group: RowData[] = [];
    while (i < data.length && data[i].code === code) {
      group.push(data[i]);
      i++;
    }

    const meta = groupMetaMap.value[code];
    const realPrice = meta ? meta.realPrice : group[0].price;

    // 先计算每行的实际 price（处理 custom 行）
    const resolvedRows = group.map((row, index) => {
      const isLast = index === group.length - 1 && index > 0;
      let price = row.price;
      let dividend = row.dividend;
      let pe = row.pe;
      let pb = row.pb;

      if (isLast && meta) {
        const cp = customPrice[code];
        const cd = customDividend[code];
        const cpe = customPE[code];
        if (cp !== undefined) {
          price = cp;
          pb = row.pb * (cp / row.price);
        }
        if (cd !== undefined) dividend = cd;
        if (cpe !== undefined) pe = cpe;
      }

      return { ...row, price, dividend, pe, pb };
    });

    // 计划市值合计
    const totalMarketCap = resolvedRows
      .slice(1)
      .reduce(
        (sum, r) => sum + (r.quantity && r.price ? r.quantity * r.price : 0),
        0,
      );

    const mergedRows: MergedRowData[] = resolvedRows.map((row, index) => {
      const isLast = index === group.length - 1 && index > 0;
      const decline =
        index === 0 ? 0 : ((realPrice - row.price) / realPrice) * 100;
      const annualDps = row.exList.reduce(
        (pre: number, cur: ExItem) => pre + getEffectiveEventDps(cur),
        0,
      );
      const adjustedAnnualDps =
        meta?.dividendAdjust != null
          ? annualDps * meta.dividendAdjust
          : undefined;

      return {
        ...row,
        nameRowSpan: index === 0 ? group.length : 0,
        exDateRowSpan: index === 0 ? group.length : 0,
        dpsRowSpan: index === 0 ? group.length : 0,
        annualDpsRowSpan: index === 0 ? group.length : 0,
        sharesHeldRowSpan: index === 0 ? group.length : 0,
        remarkRowSpan: index === 0 ? group.length : 0,
        maxPositionRatioRowSpan: index === 0 ? group.length : 0,
        strikePriceRowSpan: 0,
        annualDps,
        adjustedAnnualDps,
        isFirstRow: index === 0,
        isLastRow: isLast,
        decline,
        totalMarketCap: index === 0 ? totalMarketCap : undefined,
        rowKey: `${code}-${index}`,
        exListDisplay: buildExDisplay(row.exList),
      };
    });

    // 计算理想买点（strikePrice）
    const stockItem = stocks.find((s) => s.code === code);
    const strikePriceInfo =
      stockItem && meta
        ? computeStrikePriceInfo(stockItem.strikePrice, meta)
        : undefined;
    if (strikePriceInfo) {
      mergedRows[0]!.strikePriceRowSpan = group.length;
      for (const mr of mergedRows) {
        mr.strikePriceInfo = strikePriceInfo;
      }
    }

    groups.push({ code, rows: mergedRows });
  }

  // 按市场类型筛选
  let filteredGroups = groups;
  if (marketFilter.value.length) {
    filteredGroups = groups.filter((g) => {
      if (isHKCode(g.code)) return marketFilter.value.includes("hk");
      if (isBCode(g.code)) return marketFilter.value.includes("b");
      return marketFilter.value.includes("a");
    });
  }

  // 按行业筛选
  if (industryFilter.value.length) {
    filteredGroups = filteredGroups.filter((g) => {
      const ind = industryMap.value[g.code];
      return ind && industryFilter.value.includes(ind);
    });
  }

  // 按分区筛选
  if (zoneFilter.value.length) {
    filteredGroups = filteredGroups.filter((g) => {
      const info = g.rows[0]?.strikePriceInfo;
      if (!info) return false;
      return zoneFilter.value.includes(getDeviationZoneKey(info.deviation));
    });
  }

  // 第二步：排序
  const { key, order } = sortConfig.value;
  const sortMultiplier = order === "asc" ? 1 : -1;
  filteredGroups.sort((a, b) => {
    let aVal: number | string = 0;
    let bVal: number | string = 0;

    switch (key) {
      case "dividend":
        aVal = a.rows[0]?.dividend ?? 0;
        bVal = b.rows[0]?.dividend ?? 0;
        break;
      case "pe":
        aVal = a.rows[0]?.pe ?? 0;
        bVal = b.rows[0]?.pe ?? 0;
        break;
      case "decline":
        aVal = a.rows
          .filter((r) => !r.isFirstRow)
          .reduce((min, r) => Math.min(min, r.decline), Infinity);
        bVal = b.rows
          .filter((r) => !r.isFirstRow)
          .reduce((min, r) => Math.min(min, r.decline), Infinity);
        break;
      case "exDate": {
        const getExSortVal = (
          ex: MergedRowData["exListDisplay"][number] | undefined,
        ): number => {
          if (!ex) return 99999;
          const s = ex.status;
          if (s === "paid" || s === "past_year") return 20000;
          if (s === "unknown") return 10000;
          return ex.daysUntilEx ?? 9999;
        };
        aVal = getExSortVal(a.rows[0]?.exListDisplay[0]);
        bVal = getExSortVal(b.rows[0]?.exListDisplay[0]);
        break;
      }
      case "change":
        aVal = a.rows[0]?.change ?? 0;
        bVal = b.rows[0]?.change ?? 0;
        break;
      case "deviation":
        aVal = a.rows[0]?.strikePriceInfo?.deviation ?? 99999;
        bVal = b.rows[0]?.strikePriceInfo?.deviation ?? 99999;
        break;
    }
    return sortMultiplier * ((aVal as number) - (bVal as number));
  });

  // 第三步：展平
  for (const g of filteredGroups) {
    result.push(...g.rows);
  }

  return result;
});
</script>

<template>
  <div class="toolbar">
    <el-select
      v-model="marketFilter"
      multiple
      placeholder="全部市场"
      collapse-tags
      collapse-tags-tooltip
      style="width: 160px; margin-right: 12px"
    >
      <el-option label="A股" value="a" />
      <el-option label="B股" value="b" />
      <el-option label="港股" value="hk" />
    </el-select>
    <el-select
      v-model="industryFilter"
      multiple
      placeholder="全部行业"
      collapse-tags
      collapse-tags-tooltip
      style="width: 160px; margin-right: 12px"
    >
      <el-option
        v-for="ind in industryOptions"
        :key="ind"
        :label="ind"
        :value="ind"
      />
    </el-select>
    <el-select
      v-model="zoneFilter"
      multiple
      placeholder="全部分区"
      collapse-tags
      collapse-tags-tooltip
      style="width: 160px; margin-right: 12px"
    >
      <el-option
        v-for="z in ZONE_OPTIONS"
        :key="z.value"
        :label="z.label"
        :value="z.value"
      />
    </el-select>
    <el-button type="primary" :loading="isLoading" @click="refresh"
      >刷新实时数据</el-button
    >
    <el-button type="primary" :loading="isLoading" @click="init"
      >更新分红数据</el-button
    >
    <el-button type="primary" @click="portfolioDialogVisible = true"
      >透视盈余</el-button
    >
  </div>

  <div v-if="indexList.length" class="index-bar">
    <div v-if="indexListGroup1.length" class="index-group">
      <span v-for="idx in indexListGroup1" :key="idx.code" class="index-item">
        {{ idx.label }}：<span class="blue">{{ Math.round(idx.price) }}</span
        >（<span :class="idx.change >= 0 ? 'red' : 'green'"
          >{{ idx.change >= 0 ? "+" : "" }}{{ idx.change.toFixed(2) }}%</span
        >）
      </span>
    </div>
    <div v-if="indexListGroup2.length" class="index-group">
      <span v-for="idx in indexListGroup2" :key="idx.code" class="index-item">
        {{ idx.label }}：<span class="blue">{{ Math.round(idx.price) }}</span
        >（<span :class="idx.change >= 0 ? 'red' : 'green'"
          >{{ idx.change >= 0 ? "+" : "" }}{{ idx.change.toFixed(2) }}%</span
        >）
      </span>
    </div>
  </div>

  <div v-if="dividendUpdateTime || dynamicUpdateTime" class="table-tip">
    <span v-if="dynamicUpdateTime"
      >行情数据更新时间：{{ dynamicUpdateTime }}</span
    >
    <span v-if="dividendUpdateTime && dynamicUpdateTime"> | </span>
    <span v-if="dividendUpdateTime"
      >分红数据更新时间：{{ dividendUpdateTime }}</span
    >
  </div>

  <table v-if="mergedTableData.length" class="stock-pool-table">
    <thead>
      <tr>
        <th class="bold light-blue sortable" @click="handleSort('change')">
          <span class="sort-header">
            名称
            <span class="sort-arrows">
              <el-icon
                :size="12"
                :class="{ active: getSortActive('change', 'asc') }"
                ><CaretTop
              /></el-icon>
              <el-icon
                :size="12"
                :class="{ active: getSortActive('change', 'desc') }"
                ><CaretBottom
              /></el-icon>
            </span>
          </span>
        </th>
        <th class="bold blue">股价</th>
        <th class="bold red sortable" @click="handleSort('dividend')">
          <span class="sort-header">
            股息率
            <span class="sort-arrows">
              <el-icon
                :size="12"
                :class="{ active: getSortActive('dividend', 'asc') }"
                ><CaretTop
              /></el-icon>
              <el-icon
                :size="12"
                :class="{ active: getSortActive('dividend', 'desc') }"
                ><CaretBottom
              /></el-icon>
            </span>
          </span>
        </th>
        <th class="bold red sortable" @click="handleSort('pe')">
          <span class="sort-header">
            PE_TTM
            <span class="sort-arrows">
              <el-icon
                :size="12"
                :class="{ active: getSortActive('pe', 'asc') }"
                ><CaretTop
              /></el-icon>
              <el-icon
                :size="12"
                :class="{ active: getSortActive('pe', 'desc') }"
                ><CaretBottom
              /></el-icon>
            </span>
          </span>
        </th>
        <th class="bold bg-green sortable" @click="handleSort('decline')">
          <span class="sort-header">
            还要跌
            <span class="sort-arrows">
              <el-icon
                :size="12"
                :class="{ active: getSortActive('decline', 'asc') }"
                ><CaretTop
              /></el-icon>
              <el-icon
                :size="12"
                :class="{ active: getSortActive('decline', 'desc') }"
                ><CaretBottom
              /></el-icon>
            </span>
          </span>
        </th>
        <th class="bold light-blue sortable" @click="handleSort('deviation')">
          <span class="sort-header">
            理想买点
            <span class="sort-arrows">
              <el-icon
                :size="12"
                :class="{ active: getSortActive('deviation', 'asc') }"
                ><CaretTop
              /></el-icon>
              <el-icon
                :size="12"
                :class="{ active: getSortActive('deviation', 'desc') }"
                ><CaretBottom
              /></el-icon>
            </span>
          </span>
        </th>
        <th class="bold sortable" @click="handleSort('exDate')">
          <span class="sort-header">
            除权除息
            <span class="sort-arrows">
              <el-icon
                :size="12"
                :class="{ active: getSortActive('exDate', 'asc') }"
                ><CaretTop
              /></el-icon>
              <el-icon
                :size="12"
                :class="{ active: getSortActive('exDate', 'desc') }"
                ><CaretBottom
              /></el-icon>
            </span>
          </span>
        </th>
        <th class="bold">每股分红</th>
        <th class="bold bg-pink red">年分红</th>
        <th class="bold">计划股数</th>
        <th class="bold">计划市值</th>
        <th class="bold">持有</th>
        <th class="bold">备注</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(row, idx) in mergedTableData"
        :key="idx"
        :class="{ 'real-time-row': row.isFirstRow }"
      >
        <td v-if="row.nameRowSpan > 0" :rowspan="row.nameRowSpan" class="bold">
          <div>
            <a v-if="row.url" :href="row.url" class="stock-link">{{
              displayName(row.name, row.code)
            }}</a>
            <span v-else>{{ displayName(row.name, row.code) }}</span>
          </div>
          <div class="stock-code">{{ row.code }}</div>
          <div
            v-if="row.change !== undefined"
            class="stock-change"
            :class="row.change >= 0 ? 'red' : 'green'"
          >
            {{ row.change >= 0 ? "+" : "" }}{{ row.change.toFixed(2) }}%
          </div>
          <el-rate
            :model-value="qualityScoreMap[row.code]"
            disabled
            class="moat-rate"
          />
        </td>
        <td
          class="bold"
          :class="[
            row.isFirstRow ? 'red' : 'blue',
            { 'bg-pink': row.decline < 5 && !row.isFirstRow },
          ]"
        >
          <el-input-number
            v-if="row.isLastRow"
            v-model="editPrice[row.code]"
            :precision="2"
            :controls="false"
            size="small"
            class="plan-price-input"
            @blur="onPriceBlur(row.code)"
          />
          <template v-else>
            <div>{{ formatPrice(row.price, row.code) }}</div>
            <div
              v-if="row.isFirstRow && row.marketValue != null"
              class="market-cap"
            >
              {{ formatMarketCap(row.marketValue, row.code) }}
            </div>
          </template>
        </td>
        <td
          class="bold"
          :class="{
            red: !row.isFirstRow,
            'bg-pink': row.decline < 5 && !row.isFirstRow,
          }"
        >
          <el-input-number
            v-if="row.isLastRow"
            v-model="editDividend[row.code]"
            :precision="4"
            :controls="false"
            size="small"
            class="plan-dividend-input"
            @blur="onDividendBlur(row.code)"
          />
          <span v-else>{{ formatPercent(row.dividend * 100) }}</span>
        </td>
        <td
          class="bold"
          :class="{
            red: !row.isFirstRow,
            'bg-pink': row.decline < 5 && !row.isFirstRow,
          }"
        >
          <el-input-number
            v-if="row.isLastRow"
            v-model="editPE[row.code]"
            :precision="2"
            :controls="false"
            size="small"
            class="plan-pe-input"
            @blur="onPEBlur(row.code)"
          />
          <span v-else-if="row.pe">{{ formatNum(row.pe, 2).toFixed(2) }}</span>
          <span v-else>-</span>
        </td>
        <td
          class="bold"
          :class="
            row.decline < 5 && !row.isFirstRow ? 'bg-light-red' : 'bg-green'
          "
        >
          {{ row.decline === 0 ? "-" : formatPercent(row.decline) }}
        </td>
        <td
          v-if="row.strikePriceRowSpan > 0"
          :rowspan="row.strikePriceRowSpan"
          class="bold strike-price-cell"
        >
          <template v-if="row.strikePriceInfo">
            <div class="sp-price">
              {{ formatPrice(row.strikePriceInfo.price, row.code) }}
            </div>
            <div
              class="sp-deviation"
              :class="getDeviationZoneClass(row.strikePriceInfo.deviation)"
            >
              <span
                >偏离：{{ formatPercent(row.strikePriceInfo.deviation) }}</span
              >
              <br />
              <span>{{
                getDeviationLabel(row.strikePriceInfo.deviation)
              }}</span>
            </div>
            <div class="sp-dividend">
              {{ formatPercent(row.strikePriceInfo.dividend * 100) }} |
              {{ formatNum(row.strikePriceInfo.pe, 2).toFixed(2) }}
            </div>
          </template>
        </td>
        <td
          v-if="row.exDateRowSpan > 0"
          :rowspan="row.exDateRowSpan"
          class="bold"
        >
          <div
            v-for="(ex, i) in row.exListDisplay"
            :key="i"
            :class="'dividend-status dividend-' + ex.status"
            :title="getExTitle(ex)"
          >
            {{ formatShortExDate(ex.exDate) }}
          </div>
        </td>
        <td v-if="row.dpsRowSpan > 0" :rowspan="row.dpsRowSpan" class="bold">
          <div
            v-for="(ex, i) in row.exListDisplay"
            :key="i"
            :class="'dividend-status dividend-' + ex.status"
          >
            {{ getCurrencyPrefix(row.code) }}{{ Number(ex.dps.toFixed(4)) }}
            <el-tooltip
              v-if="ex.bonusRatio"
              :content="ex.planRaw || ''"
              placement="top"
            >
              <el-icon :size="12" class="bonus-icon"><WarningFilled /></el-icon>
            </el-tooltip>
          </div>
        </td>
        <td
          v-if="row.annualDpsRowSpan > 0"
          :rowspan="row.annualDpsRowSpan"
          class="bold bg-pink red"
        >
          <div>
            {{ getCurrencyPrefix(row.code)
            }}{{ row.annualDps ? row.annualDps.toFixed(2) : "-" }}
          </div>
          <div v-if="row.adjustedAnnualDps !== undefined">
            {{ getCurrencyPrefix(row.code)
            }}{{ row.adjustedAnnualDps.toFixed(2) }}
          </div>
        </td>
        <td class="bold">
          <template v-if="row.isFirstRow && row.maxPositionRatio !== undefined">
            <span class="normal red"
              >{{ (row.maxPositionRatio * 100).toFixed(0) }}%</span
            >
          </template>
          <template v-else>{{ row.quantity || "-" }}</template>
        </td>
        <td class="bold">
          <template
            v-if="row.totalMarketCap !== undefined && row.totalMarketCap > 0"
          >
            <template v-if="canConvertToCNY(row.code)">
              <div>
                {{ getCurrencyPrefix(row.code)
                }}{{ row.totalMarketCap.toFixed(0) }}
              </div>
              <div>￥{{ (row.totalMarketCap / exchangeRate).toFixed(0) }}</div>
            </template>
            <template v-else>
              {{ getCurrencyPrefix(row.code)
              }}{{ row.totalMarketCap.toFixed(0) }}
            </template>
          </template>
          <template v-else-if="row.quantity && row.price">
            <template v-if="canConvertToCNY(row.code)">
              <div>
                {{ getCurrencyPrefix(row.code)
                }}{{ (row.quantity * row.price).toFixed(0) }}
              </div>
              <div>
                ￥{{ ((row.quantity * row.price) / exchangeRate).toFixed(0) }}
              </div>
            </template>
            <template v-else>
              {{ getCurrencyPrefix(row.code)
              }}{{ (row.quantity * row.price).toFixed(0) }}
            </template>
          </template>
          <span v-else>-</span>
        </td>
        <td
          v-if="row.sharesHeldRowSpan > 0"
          :rowspan="row.sharesHeldRowSpan"
          class="bold"
        >
          <div>{{ row.sharesHeld != null ? row.sharesHeld : "-" }}</div>
          <template v-if="row.sharesHeld != null && row.price > 0">
            <template v-if="canConvertToCNY(row.code)">
              <div>
                {{ getCurrencyPrefix(row.code)
                }}{{ (row.sharesHeld * row.price).toFixed(0) }}
              </div>
              <div>
                ￥{{ ((row.sharesHeld * row.price) / exchangeRate).toFixed(0) }}
              </div>
            </template>
            <template v-else>
              <div>
                {{ getCurrencyPrefix(row.code)
                }}{{ (row.sharesHeld * row.price).toFixed(0) }}
              </div>
            </template>
          </template>
        </td>
        <td
          v-if="row.remarkRowSpan > 0"
          :rowspan="row.remarkRowSpan"
          class="remark-cell"
        >
          {{ row.remark }}
        </td>
      </tr>
    </tbody>
  </table>

  <el-dialog
    v-model="portfolioDialogVisible"
    title="透视盈余"
    width="80%"
    top="2vh"
    destroy-on-close
    class="portfolio-dialog"
  >
    <div class="dialog-content">
      <StockPoolPortfolio />
    </div>
  </el-dialog>
</template>

<style lang="scss">
/* ===== 全局语义颜色 ===== */
.red {
  color: #ff0000;
}
.green {
  color: #00b050;
}
.blue {
  color: #2972f4;
}

html.dark {
  .red {
    color: #ff8888;
  }
  .green {
    color: #66ee66;
  }
  .blue {
    color: #88bbff;
  }
}

/* ===== 表格颜色变量 ===== */
.stock-pool-table {
  --sp-text: #000;
  --sp-text-secondary: #888;
  --sp-bg: var(--vp-c-bg);
  --sp-border: #000;
  --sp-link: #00a3f5;
  --sp-bg-green: #00b050;
  --sp-bg-pink: #ffe9e8;
  --sp-bg-light-red: #ff9c99;
  --sp-bg-dividend-bar: #fff7e6;
  --sp-color-dividend-bar: #d46b08;
  --sp-input-price-color: #2972f4;
  --sp-input-dividend-color: #ff0000;
  --sp-input-pe-color: #ff0000;
}

html.dark {
  .stock-pool-table {
    --sp-text: #fff;
    --sp-text-secondary: var(--vp-c-text-3);
    --sp-bg: var(--vp-c-bg);
    --sp-border: var(--vp-c-divider);
    --sp-link: #7ad8ff;
    --sp-bg-green: #2a8a2a;
    --sp-bg-pink: #4a3535;
    --sp-bg-light-red: #6a3a3a;
    --sp-bg-dividend-bar: #4a3a20;
    --sp-color-dividend-bar: #ffb860;
    --sp-input-price-color: #88bbff;
    --sp-input-dividend-color: #ff8888;
    --sp-input-pe-color: #ff8888;
  }
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.index-bar {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: bold;

  .index-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;

    + .index-group {
      margin-top: 4px;
    }
  }

  .index-item {
    white-space: nowrap;
  }
}

.table-tip {
  margin-top: 16px;
  font-size: 13px;
  color: var(--vp-c-text-1);
}

.vp-doc {
  table.stock-pool-table {
    margin-top: 0;
  }
}

.stock-pool-table {
  border-collapse: collapse;
  border-spacing: 0;
  color: var(--sp-text);

  th,
  td {
    line-height: 22px;
    white-space: nowrap;
    padding: 2px 4px;
    font-size: 13px;
    color: var(--sp-text);
    font-weight: normal;
    border: 1px solid var(--sp-border);
    text-align: center;
    vertical-align: top;
    background-color: var(--sp-bg);
  }

  thead th {
    padding: 6px 8px;
    border-bottom-width: 1px;
  }

  // 表头排序
  .sortable {
    cursor: pointer;
    user-select: none;

    &:hover {
      opacity: 0.8;
    }
  }

  .sort-header {
    display: inline-flex;
    align-items: center;
  }

  .sort-arrows {
    display: inline-flex;
    flex-direction: column;
    margin-left: 3px;
    line-height: 0;

    .el-icon {
      display: block;
      color: #bbb;
      transition: color 0.15s;
      margin: -2px 0;

      &.active {
        color: #2972f4;
      }
    }
  }

  // 消除表头底部与表体顶部边框叠加：表体第一行去掉上边框
  tbody tr:first-child td {
    border-top-width: 0;
  }

  .normal {
    font-weight: normal;
  }

  .bold {
    font-weight: bold;
  }

  .light-blue {
    color: #00a3f5;
  }

  .red {
    color: #ff0000;
  }

  .green {
    color: #00b050;
  }

  .blue {
    color: #2972f4;
  }

  .orange {
    color: #f88825;
  }

  .bg-green {
    background-color: var(--sp-bg-green);
  }

  .bg-pink {
    background-color: var(--sp-bg-pink);
  }

  .bg-light-red {
    background-color: var(--sp-bg-light-red);
  }

  .stock-link {
    font-weight: bold;
    color: var(--sp-link);
    text-decoration: underline;
    cursor: pointer;
  }

  .stock-code {
    font-size: 12px;
    line-height: 16px;
    color: var(--sp-text-secondary);
    font-weight: normal;
  }

  .stock-change {
    font-size: 12px;
    line-height: 16px;
    font-weight: bold;
  }

  .moat-rate {
    height: 16px;
    --el-rate-fill-color: #f7ba2a;
    --el-rate-icon-size: 10px;
    --el-rate-icon-margin: 0px;
    justify-content: center;
  }

  .plan-price-input {
    width: 80px;

    .el-input__wrapper {
      padding: 0 4px;
    }

    .el-input__inner {
      text-align: center;
      font-weight: bold;
      font-size: 14px;
      color: var(--sp-input-price-color);
      padding: 1px 4px;
    }
  }

  .market-cap {
    font-size: 12px;
    color: #b8860b;
    font-weight: bold;
    margin-top: 2px;
  }

  .plan-dividend-input {
    width: 70px;

    .el-input__wrapper {
      padding: 0 4px;
    }

    .el-input__inner {
      text-align: center;
      font-weight: bold;
      font-size: 14px;
      color: var(--sp-input-dividend-color);
      padding: 1px 4px;
    }
  }

  .plan-pe-input {
    width: 60px;

    .el-input__wrapper {
      padding: 0 4px;
    }

    .el-input__inner {
      text-align: center;
      font-weight: bold;
      font-size: 14px;
      color: var(--sp-input-pe-color);
      padding: 1px 4px;
    }
  }

  .remark-cell {
    white-space: normal;
    max-width: 140px;
    text-align: left;
  }

  .strike-price-cell {
    font-size: 12px;
    line-height: 18px;

    .sp-price {
      color: #2972f4;
    }
    .sp-dividend {
      color: #4a7c7f;
    }
    .sp-deviation {
      display: inline-block;
      padding: 2px 5px;
      border-radius: 3px;
      font-weight: bold;

      &.zone-danger {
        background-color: #fff2f0;
        color: #ff4d4f;
      }
      &.zone-mediocre {
        background-color: #fef0e6;
        color: #cc3d00;
      }
      &.zone-observe {
        background-color: #fffbe6;
        color: #d48806;
      }
      &.zone-core {
        background-color: #f6ffed;
        color: #389e0d;
      }
      &.zone-premium {
        background-color: #e6f7ff;
        color: #096dd9;
      }
    }
  }

  .dividend-time-bar {
    background-color: var(--sp-bg-dividend-bar);
    color: var(--sp-color-dividend-bar);
    font-size: 12px;
    font-weight: bold;
    padding: 6px 8px;
    text-align: center;
    border-bottom: 2px solid var(--sp-color-dividend-bar);
  }

  // ===== 分红状态颜色 =====
  .dividend-status {
    border-radius: 2px;
    padding: 0 3px;
    margin: 1px 0;
    line-height: 20px;
  }

  // 已分红 / 往期 → 灰色
  .dividend-paid,
  .dividend-past_year {
    color: #999;
  }

  // ≤7天 → 深红
  .dividend-upcoming_urgent {
    color: #cc0000;
    background-color: rgba(204, 0, 0, 0.12);
    font-weight: 900;
  }

  // 8-30天 → 红色
  .dividend-upcoming_soon {
    color: #e65c00;
    background-color: rgba(230, 92, 0, 0.09);
    font-weight: 900;
  }

  // 31-60天 → 橙色
  .dividend-upcoming_close {
    color: #f88825;
    background-color: rgba(248, 136, 37, 0.07);
  }

  // 远期 / 未定 → 默认色
  .dividend-upcoming,
  .dividend-unknown {
    color: var(--sp-text);
  }

  .market-cap {
    color: #daa520;
  }
}

/* 暗黑模式下表格内语义颜色微调 */
html.dark {
  .stock-pool-table {
    .light-blue {
      color: #7ad8ff;
    }
    .red {
      color: #ff8888;
    }
    .green {
      color: #66ee66;
    }
    .blue {
      color: #88bbff;
    }
    .orange {
      color: #ffb860;
    }

    .sort-arrows .el-icon.active {
      color: #88bbff;
    }
    .dividend-paid,
    .dividend-past_year {
      color: #666;
    }
    .dividend-upcoming_urgent {
      color: #ff5555;
      background-color: rgba(255, 85, 85, 0.18);
    }
    .dividend-upcoming_soon {
      color: #ff8c42;
      background-color: rgba(255, 140, 66, 0.14);
    }
    .dividend-upcoming_close {
      color: #ffb860;
      background-color: rgba(255, 184, 96, 0.1);
    }
    .dividend-upcoming,
    .dividend-unknown {
      color: var(--sp-text);
    }

    .strike-price-cell {
      .sp-price {
        color: #88bbff;
      }
      .sp-dividend {
        color: #7ab5b5;
      }
      .sp-deviation {
        &.zone-danger {
          background-color: #2a1215;
          color: #ff7875;
        }
        &.zone-mediocre {
          background-color: #2d1b10;
          color: #ff8c52;
        }
        &.zone-observe {
          background-color: #2b2611;
          color: #ffc53d;
        }
        &.zone-core {
          background-color: #162312;
          color: #73d13d;
        }
        &.zone-premium {
          background-color: #111d2c;
          color: #69c0ff;
        }
      }
    }
  }
}

.portfolio-dialog {
  .dialog-content {
    display: flex;
    justify-content: center;
  }

  .el-dialog__body {
    max-height: 88vh;
    overflow: auto;
  }
}

.bonus-icon {
  color: #e6a23c;
  vertical-align: middle;
  margin-left: 2px;
  cursor: help;
}
</style>
