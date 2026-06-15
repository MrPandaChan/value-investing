<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { getDynamicData } from "../../../fetch-data/fetch-stock-data";
import {
  formatNum,
  formatPercent,
  canConvertToCNY,
  getCurrencyPrefix,
  isBCode,
  isHKCode,
} from "../../../fetch-data/helper";
import { fetchAllDividendData, type ExItem } from "./fetch-dividend";
import { PlanType, planList } from "./plan";

interface RowData {
  name: string;
  code: string;
  price: number;
  pe: number;
  dividend: number;
  quantity: number;
  url?: string;
  remark?: string;
  maxPositionRatio?: number;
  change?: number; // 涨跌幅，仅实时行
  exList: { dps: number; exDate: string }[];
}

interface MergedRowData extends RowData {
  nameRowSpan: number;

  exDateRowSpan: number;
  dpsRowSpan: number;
  annualDpsRowSpan: number;
  remarkRowSpan: number;
  maxPositionRatioRowSpan: number;
  annualDps: number;
  adjustedAnnualDps?: number;
  isFirstRow: boolean;
  isLastRow: boolean;
  decline: number;
  totalMarketCap?: number;
  rowKey: string;
}

const tableData = ref<RowData[]>([]);
const exListMap = ref<Record<string, ExItem[]>>({});

interface GroupMeta {
  planType: PlanType;
  dps: number;
  effectiveDps: number; // 调整后年分红 = dps * dividendAdjust，用于计划行目标价反推
  pricePE: number;
  realPrice: number;
  dividendAdjust?: number;
}
const groupMetaMap = ref<Record<string, GroupMeta>>({});
const customPrice = reactive<Record<string, number>>({});
const customDividend = reactive<Record<string, number>>({});
const customPE = reactive<Record<string, number>>({});
// 编辑缓冲：input 绑定到这些 buffer，仅 blur 时同步到 custom*
const editPrice = reactive<Record<string, number>>({});
const editDividend = reactive<Record<string, number>>({});
const editPE = reactive<Record<string, number>>({});
const exchangeRate = ref(1.1555); // 港币兑人民币汇率
const marketFilter = ref<string[]>([]); // 市场筛选：空数组表示全部
const changeSortOrder = ref<"asc" | "desc" | null>(null); // null=默认, "desc"=按涨幅, "asc"=按跌幅

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
];

// 第二组：宽基指数（上证50 → 中证2000）
const INDEX_CODES_GROUP2: { code: string; label: string }[] = [
  { code: "1.000016", label: "上证50" },
  { code: "0.399850", label: "深证50" },
  { code: "1.000300", label: "沪深300" },
  { code: "1.000905", label: "中证500" },
  { code: "1.000852", label: "中证1000" },
  { code: "2.932000", label: "中证2000" },
];

// 合并数组：供 fetchIndices 统一获取数据
const INDEX_CODES: { code: string; label: string }[] = [
  ...INDEX_CODES_GROUP1,
  ...INDEX_CODES_GROUP2,
];
const indexList = ref<IndexData[]>([]);

// 从 indexList 中按组拆分，用 label 匹配（因 fetchIndices 按 INDEX_CODES 顺序填充）
const group1Labels = new Set(INDEX_CODES_GROUP1.map((v) => v.label));
const group2Labels = new Set(INDEX_CODES_GROUP2.map((v) => v.label));
const indexListGroup1 = computed(() =>
  indexList.value.filter((v) => group1Labels.has(v.label))
);
const indexListGroup2 = computed(() =>
  indexList.value.filter((v) => group2Labels.has(v.label))
);

async function fetchIndices() {
  const indexCodeList = INDEX_CODES.map((v) => v.code);
  const dynamicDataList = await getDynamicData(indexCodeList);
  indexList.value = INDEX_CODES.map((item) => {
    // API 返回的 f12 是点后面的部分，如 "100.HSI" → "HSI"、"1.00001" → "00001"
    const shortCode = item.code.split(".").pop()!;
    const d = dynamicDataList.find((v) => v.code === shortCode);
    return {
      code: item.code,
      label: item.label,
      price: d ? d.price : 0,
      change: d ? d.change : 0,
    };
  });
}

const STORAGE_KEY = "stock-pool-data";
const MARKET_FILTER_STORAGE_KEY = "stock-pool-market-filter";

// 基于 planList 结构自动生成指纹，planList 变更时自动失效旧缓存
function computeFingerprint(): string {
  const entries = planList.map((item) => {
    const base = {
      code: item.code,
      type: item.type === PlanType.PRICE ? "PRICE" : "DIVIDEND",
      dpy: item.dividendPerYear,
      adj: item.dividendAdjust,
      remark: item.remark,
      mpr: item.maxPositionRatio,
    };
    if (item.type === PlanType.PRICE) {
      return {
        ...base,
        entries: item.price.map((e) => ({ v: e.value, q: e.quantity })),
      };
    }
    return {
      ...base,
      entries: item.dividend.map((e) => ({ v: e.value, q: e.quantity })),
    };
  });
  return JSON.stringify(entries);
}

// 按股票 code 去重存储，避免 name/url/exList 重复
interface StockStorage {
  name: string;
  url?: string;
  remark?: string;
  maxPositionRatio?: number;
  change?: number;
  rows: {
    price: number;
    pe: number;
    dividend: number;
    quantity: number;
  }[];
  exList: { dps: number; exDate: string }[];
  meta: GroupMeta;
}

interface StorageData {
  version: string;
  stocks: Record<string, StockStorage>;
  customPrice: Record<string, number>;
  customDividend: Record<string, number>;
  customPE: Record<string, number>;
}

function saveToStorage() {
  const stocks: Record<string, StockStorage> = {};
  const codes = [...new Set(tableData.value.map((r) => r.code))];
  for (const code of codes) {
    const rows = tableData.value.filter((r) => r.code === code);
    const first = rows[0];
    stocks[code] = {
      name: first.name,
      url: first.url,
      remark: first.remark,
      maxPositionRatio: first.maxPositionRatio,
      change: first.change,
      rows: rows.map((r) => ({
        price: r.price,
        pe: r.pe,
        dividend: r.dividend,
        quantity: r.quantity,
      })),
      exList: first.exList,
      meta: groupMetaMap.value[code],
    };
  }
  const data: StorageData = {
    version: computeFingerprint(),
    stocks,
    customPrice: { ...customPrice },
    customDividend: { ...customDividend },
    customPE: { ...customPE },
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFromStorage(): boolean {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const data: StorageData = JSON.parse(raw);
    // 指纹不匹配则丢弃旧缓存，用最新 planList 重新初始化
    if (data.version !== computeFingerprint()) return false;
    const codes = Object.keys(data.stocks || {});
    if (!codes.length) return false;

    tableData.value = [];
    groupMetaMap.value = {};
    for (const code of codes) {
      const s = data.stocks[code];
      if (!s) continue;
      groupMetaMap.value[code] = s.meta;
      for (const r of s.rows) {
        tableData.value.push({
          name: s.name,
          code,
          price: r.price,
          pe: r.pe,
          dividend: r.dividend,
          quantity: r.quantity,
          url: s.url,
          exList: s.exList,
          remark: s.remark,
          maxPositionRatio: s.maxPositionRatio,
          change: s.change,
        });
      }
    }

    Object.keys(customPrice).forEach((k) => delete customPrice[k]);
    Object.keys(customDividend).forEach((k) => delete customDividend[k]);
    Object.keys(customPE).forEach((k) => delete customPE[k]);
    Object.assign(customPrice, data.customPrice || {});
    Object.assign(customDividend, data.customDividend || {});
    Object.assign(customPE, data.customPE || {});
    syncAllEdits();
    return true;
  } catch {
    // ignore
  }
  return false;
}

onMounted(() => {
  loadFromStorage();
  refresh();
  fetchIndices(); // 指数数据始终实时获取
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
});

watch(
  [customPrice, customDividend, customPE],
  () => {
    if (tableData.value.length) saveToStorage();
  },
  { deep: true }
);

watch(
  marketFilter,
  (val) => {
    localStorage.setItem(MARKET_FILTER_STORAGE_KEY, JSON.stringify(val));
  },
  { deep: true }
);

async function init() {
  tableData.value = [];
  const stockCodes = planList.map((v) => v.code);
  const [dynamicDataList, exListMapResult] = await Promise.all([
    getDynamicData([...stockCodes, "133.CNHHKD"]),
    fetchAllDividendData(stockCodes),
  ]);
  exListMap.value = exListMapResult;
  const exchangeTarget = dynamicDataList.find((v) => v.code === "CNHHKD");
  if (exchangeTarget) {
    exchangeRate.value = exchangeTarget.price / 100;
  }
  // 港股人民币分红按汇率转为港币（字符串中的港币计算值不准确）
  for (const item of planList) {
    if (isHKCode(item.code)) {
      const exList = exListMap.value[item.code];
      if (exList) {
        for (const ex of exList) {
          if (ex.isRmb) {
            ex.dps = ex.dps * exchangeRate.value;
            delete ex.isRmb;
          }
        }
      }
    }
  }
  // B股分红数据为人民币，转为港币后再计算股息率
  for (const item of planList) {
    if (isBCode(item.code)) {
      const exList = exListMap.value[item.code];
      if (exList) {
        for (const ex of exList) {
          ex.dps = ex.dps * exchangeRate.value;
        }
      }
    }
  }

  for (let i = 0; i < stockCodes.length; i += 1) {
    const item = planList[i];
    const dynamicData = dynamicDataList.find((v) => v.code === item.code);
    if (dynamicData) {
      const {
        name,
        code,
        price,
        prevClose: originPrevClose,
        PE_TTM,
        change,
      } = dynamicData;
      const prevClose = isHKCode(code)
        ? originPrevClose / 1000
        : originPrevClose / 100;
      // 港股 PE_TTM 是以收盘价来算的
      const pricePE = isHKCode(code)
        ? PE_TTM * (1 + (price - prevClose) / prevClose)
        : PE_TTM;
      const rawExList = exListMap.value[code] || [];
      const exList = item.dividendPerYear
        ? rawExList.slice(0, item.dividendPerYear)
        : rawExList;
      const dps =
        Math.round(exList.reduce((pre, cur) => pre + cur.dps, 0) * 100) / 100;
      const effectiveDps =
        item.dividendAdjust != null
          ? Math.round(dps * item.dividendAdjust * 100) / 100
          : dps;
      groupMetaMap.value[code] = {
        planType: item.type,
        dps,
        effectiveDps,
        pricePE,
        realPrice: price,
        dividendAdjust: item.dividendAdjust,
      };
      tableData.value.push({
        name,
        code,
        price,
        pe: pricePE,
        dividend: effectiveDps / price,
        quantity: 0,
        url: item.url,
        exList,
        change,
        remark: item.remark,
        maxPositionRatio: item.maxPositionRatio,
      });
      if (item.type === PlanType.PRICE) {
        for (let pi = 0; pi < item.price.length; pi++) {
          const v = item.price[pi];
          tableData.value.push({
            name,
            code,
            price: v.value,
            pe: pricePE * (v.value / price),
            dividend: effectiveDps / v.value,
            quantity: v.quantity,
            url: item.url,
            exList,
            remark: item.remark,
            maxPositionRatio: item.maxPositionRatio,
          });
        }
      } else if (item.type === PlanType.DIVIDEND) {
        for (let pi = 0; pi < item.dividend.length; pi++) {
          const v = item.dividend[pi];
          const targetPrice = effectiveDps / v.value;
          tableData.value.push({
            name,
            code,
            price: targetPrice,
            pe: pricePE * (targetPrice / price),
            dividend: v.value,
            quantity: v.quantity,
            url: item.url,
            exList,
            remark: item.remark,
            maxPositionRatio: item.maxPositionRatio,
          });
        }
      }
    }
  }

  // 初始化 customPrice / customDividend / customPE 为每个公司最后一行的值
  // 先清空
  Object.keys(customPrice).forEach((k) => delete customPrice[k]);
  Object.keys(customDividend).forEach((k) => delete customDividend[k]);
  Object.keys(customPE).forEach((k) => delete customPE[k]);
  for (const item of planList) {
    const rows = tableData.value.filter((r) => r.code === item.code);
    if (rows.length > 1) {
      const lastRow = rows[rows.length - 1];
      customPrice[item.code] = lastRow.price;
      customDividend[item.code] = lastRow.dividend;
      customPE[item.code] = lastRow.pe;
    }
  }

  // 提取指数数据
  fetchIndices();

  syncAllEdits();
  saveToStorage();
}

async function refresh() {
  if (!tableData.value.length) {
    return init();
  }
  const stockCodes = planList.map((v) => v.code);
  const dynamicDataList = await getDynamicData([...stockCodes, "133.CNHHKD"]);

  const exchangeTarget = dynamicDataList.find((v) => v.code === "CNHHKD");
  if (exchangeTarget) {
    exchangeRate.value = exchangeTarget.price / 100;
  }

  for (let i = 0; i < stockCodes.length; i++) {
    const item = planList[i];
    const dynamicData = dynamicDataList.find((v) => v.code === item.code);
    if (!dynamicData) continue;

    const { price, prevClose: originPrevClose, PE_TTM, change } = dynamicData;
    const code = item.code;
    const prevClose = isHKCode(code)
      ? originPrevClose / 1000
      : originPrevClose / 100;
    const pricePE = isHKCode(code)
      ? PE_TTM * (1 + (price - prevClose) / prevClose)
      : PE_TTM;
    const meta = groupMetaMap.value[code];
    const dps = meta?.dps || 0;
    const effectiveDps =
      item.dividendAdjust != null
        ? Math.round(dps * item.dividendAdjust * 100) / 100
        : dps;

    groupMetaMap.value[code] = {
      ...(meta || {
        planType: item.type,
        dps: 0,
        effectiveDps: 0,
        dividendAdjust: undefined,
      }),
      pricePE,
      realPrice: price,
    };

    // 更新 tableData 中该 code 的行
    const rows = tableData.value.filter((r) => r.code === code);
    rows.forEach((row, index) => {
      if (index === 0) {
        // 实时行
        row.price = price;
        row.pe = pricePE;
        row.dividend = effectiveDps / price;
        row.change = change;
      } else {
        // 计划行
        if (item.type === PlanType.PRICE) {
          const planPrice = item.price[index - 1].value;
          row.price = planPrice;
          row.pe = pricePE * (planPrice / price);
          row.dividend = effectiveDps / planPrice;
        } else {
          const planDiv = item.dividend[index - 1].value;
          const targetPrice = effectiveDps / planDiv;
          row.price = targetPrice;
          row.pe = pricePE * (targetPrice / price);
          row.dividend = planDiv;
        }
      }
    });

    // 更新 custom 行
    if (rows.length > 1) {
      const lastRow = rows[rows.length - 1];
      customPrice[code] = lastRow.price;
      customDividend[code] = lastRow.dividend;
      customPE[code] = lastRow.pe;
    }
  }

  // 更新指数数据
  fetchIndices();

  syncAllEdits();
  saveToStorage();
}

function formatPrice(price: number, code: string): string {
  const prefix = getCurrencyPrefix(code);
  return `${prefix}${formatNum(price, 2).toFixed(2)}`;
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

function toggleChangeSort() {
  if (!changeSortOrder.value) {
    changeSortOrder.value = "desc";
  } else if (changeSortOrder.value === "desc") {
    changeSortOrder.value = "asc";
  } else {
    changeSortOrder.value = null;
  }
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

      if (isLast && meta) {
        const cp = customPrice[code];
        const cd = customDividend[code];
        const cpe = customPE[code];
        if (cp !== undefined) price = cp;
        if (cd !== undefined) dividend = cd;
        if (cpe !== undefined) pe = cpe;
      }

      return { ...row, price, dividend, pe };
    });

    // 计划市值合计
    const totalMarketCap = resolvedRows
      .slice(1)
      .reduce(
        (sum, r) => sum + (r.quantity && r.price ? r.quantity * r.price : 0),
        0
      );

    const mergedRows: MergedRowData[] = resolvedRows.map((row, index) => {
      const isLast = index === group.length - 1 && index > 0;
      const decline =
        index === 0 ? 0 : ((realPrice - row.price) / realPrice) * 100;
      const annualDps = row.exList.reduce((pre, cur) => pre + cur.dps, 0);
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
        remarkRowSpan: index === 0 ? group.length : 0,
        maxPositionRatioRowSpan: index === 0 ? group.length : 0,
        annualDps,
        adjustedAnnualDps,
        isFirstRow: index === 0,
        isLastRow: isLast,
        decline,
        totalMarketCap: index === 0 ? totalMarketCap : undefined,
        rowKey: `${code}-${index}`,
      };
    });

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

  // 第二步：排序
  if (changeSortOrder.value) {
    // 按涨跌幅排序
    filteredGroups.sort((a, b) => {
      const aChange = a.rows[0]?.change ?? 0;
      const bChange = b.rows[0]?.change ?? 0;
      return changeSortOrder.value === "desc"
        ? bChange - aChange
        : aChange - bChange;
    });
  } else {
    // 默认按最小跌幅（计划行中 decline 最小值）升序排列
    filteredGroups.sort((a, b) => {
      const aMinDecline = a.rows
        .filter((r) => !r.isFirstRow)
        .reduce((min, r) => Math.min(min, r.decline), Infinity);
      const bMinDecline = b.rows
        .filter((r) => !r.isFirstRow)
        .reduce((min, r) => Math.min(min, r.decline), Infinity);
      return aMinDecline - bMinDecline;
    });
  }

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
    <el-button
      :type="changeSortOrder ? 'primary' : 'default'"
      @click="toggleChangeSort"
    >
      <template v-if="!changeSortOrder">涨跌幅排序</template>
      <template v-else-if="changeSortOrder === 'desc'">按涨幅排序</template>
      <template v-else>按跌幅排序</template>
    </el-button>
    <el-button type="primary" @click="refresh">刷新实时数据</el-button>
    <el-button type="primary" @click="init"
      >初始化/获取分红数据（避免高频调用）</el-button
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

  <table v-if="mergedTableData.length" class="stock-pool-table">
    <thead>
      <tr>
        <th class="bold light-blue">名称</th>
        <th class="bold blue">股价</th>
        <th class="bold red">股息率</th>
        <th class="bold red">PE_TTM</th>
        <th class="bold bg-green">还要跌</th>
        <th class="bold">除权除息</th>
        <th class="bold">每股分红</th>
        <th class="bold bg-pink red">年分红</th>
        <th class="bold">计划股数</th>
        <th class="bold">计划市值</th>
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
              row.name
            }}</a>
            <span v-else>{{ row.name }}</span>
          </div>
          <div class="stock-code">{{ row.code }}</div>
          <div
            v-if="row.change !== undefined"
            class="stock-change"
            :class="row.change >= 0 ? 'red' : 'green'"
          >
            {{ row.change >= 0 ? "+" : "" }}{{ row.change.toFixed(2) }}%
          </div>
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
          <span v-else>{{ formatPrice(row.price, row.code) }}</span>
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
          <span v-else>{{ formatNum(row.pe, 2).toFixed(2) }}</span>
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
          v-if="row.exDateRowSpan > 0"
          :rowspan="row.exDateRowSpan"
          class="bold"
        >
          <div v-for="(ex, i) in row.exList" :key="i">{{ ex.exDate }}</div>
        </td>
        <td v-if="row.dpsRowSpan > 0" :rowspan="row.dpsRowSpan" class="bold">
          <div v-for="(ex, i) in row.exList" :key="i">
            {{ getCurrencyPrefix(row.code) }}{{ Number(ex.dps.toFixed(4)) }}
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
          v-if="row.remarkRowSpan > 0"
          :rowspan="row.remarkRowSpan"
          class="remark-cell"
        >
          {{ row.remark }}
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style lang="scss">
.red {
  color: #ff0000;
}

.green {
  color: #00b050;
}

.blue {
  color: #2972f4;
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

.stock-pool-table {
  border-collapse: collapse;
  border-spacing: 0;
  font-size: 13px;
  color: #000;
  margin-top: 16px;

  th,
  td {
    line-height: 22px;
    white-space: nowrap;
    padding: 4px 6px;
    color: #000;
    font-weight: normal;
    border: 1px solid #000;
    text-align: center;
    vertical-align: top;
    background-color: #fff;
  }

  thead th {
    padding: 6px 8px;
    border-bottom-width: 1px;
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
    background-color: #00b050;
  }

  .bg-pink {
    background-color: #ffe9e8;
  }

  .bg-light-red {
    background-color: #ff9c99;
  }

  .stock-link {
    font-weight: bold;
    color: #00a3f5;
    text-decoration: underline;
    cursor: pointer;
  }

  .stock-code {
    font-size: 12px;
    color: #888;
    font-weight: normal;
  }

  .stock-change {
    font-size: 12px;
    font-weight: normal;
    font-weight: bold;
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
      color: #2972f4;
      padding: 1px 4px;
    }
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
      color: #ff0000;
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
      color: #ff0000;
      padding: 1px 4px;
    }
  }

  .remark-cell {
    white-space: normal;
    max-width: 140px;
    text-align: left;
  }
}
</style>
