import { computed, reactive, ref, watch } from "vue";
import { getExchangeRate } from "../../../fetch-data/fetch-stock-data";
import { getDynamicDataFromTencent } from "../../../fetch-data/fetch-tencent-stock";
import { isHKCode, isBCode, isETFCode } from "../../../fetch-data/helper";
import type { DynamicData } from "../../../fetch-data/types";
import {
  fetchAllDividendData,
  getEffectiveEventDps,
  type ExItem,
} from "./fetch-dividend";
import {
  PlanType,
  stocks,
  type StockItem,
  type EntryPrice,
} from "../../my-data/stock-pool";

export interface RowData {
  name: string;
  code: string;
  price: number;
  pe: number;
  pb: number;
  dividend: number;
  quantity: number;
  sharesHeld?: number;
  url?: string;
  remark?: string;
  maxPositionRatio?: number;
  change?: number; // 涨跌幅，仅实时行
  exList: ExItem[];
}

export interface GroupMeta {
  planType: PlanType;
  dps: number;
  effectiveDps: number; // 调整后年分红 = dps * dividendAdjust，用于计划行目标价反推
  pricePE: number;
  realPrice: number;
  dividendAdjust?: number;
}

export interface StrikePriceInfo {
  price: number;
  dividend: number;
  deviation: number;
  pe: number;
}

/**
 * 根据买入点类型和参数计算目标价格、股息率和偏离度
 * 计算方式与买入计划行一致，可复用
 */
export function computeStrikePriceInfo(
  entry: EntryPrice,
  meta: GroupMeta,
): StrikePriceInfo {
  const { effectiveDps, realPrice, pricePE } = meta;
  let price: number;
  let dividend: number;

  if (entry.type === PlanType.PRICE) {
    price = entry.value;
    dividend = effectiveDps / price;
  } else if (entry.type === PlanType.DIVIDEND) {
    price = effectiveDps / entry.value;
    dividend = entry.value;
  } else {
    // PlanType.PE
    price = realPrice * (entry.value / pricePE);
    dividend = effectiveDps / price;
  }

  const deviation = ((realPrice - price) / realPrice) * 100;
  const pe = pricePE * (price / realPrice);

  return { price, dividend, deviation, pe };
}

const STORAGE_KEY = "stock-pool-data";
const DIVIDEND_STORAGE_KEY = "stock-pool-dividend";

// 模块级共享状态（单例）：所有使用此 composable 的组件共享同一份数据
const tableData = ref<RowData[]>([]);
const exListMap = ref<Record<string, ExItem[]>>({});
const groupMetaMap = ref<Record<string, GroupMeta>>({});
const customPrice = reactive<Record<string, number>>({});
const customDividend = reactive<Record<string, number>>({});
const customPE = reactive<Record<string, number>>({});
const exchangeRate = ref(1.1555); // 港币兑人民币汇率（1 CNY = exchangeRate HKD）
const dividendUpdateTime = ref(""); // 分红数据更新时间
const dynamicUpdateTime = ref(""); // 动态数据（股价等）更新时间

/** 指数实时数据：code → { price, change } */
const indexDataMap = ref<Record<string, { price: number; change: number }>>({});

/** 需要获取的指数代码列表（由外部设置） */
let indexCodes: string[] = [];

/** 从动态数据中提取指数数据 */
function updateIndexData(
  dynamicDataList: { code: string; price: number; change: number }[],
) {
  const map: Record<string, { price: number; change: number }> = {};
  for (const code of indexCodes) {
    // 直接以完整原始 code 匹配（如 "1.000001"），避免与个股 code 冲突
    const d = dynamicDataList.find((v) => v.code === code);
    if (d) map[code] = { price: d.price, change: d.change };
  }
  indexDataMap.value = map;
}

// 防止并发 init/refresh 调用
const loadingPromise = ref<Promise<void> | null>(null);
const isLoading = computed(() => loadingPromise.value !== null);

// 基于 stocks 结构自动生成指纹，数据变更时自动失效旧缓存
function computeFingerprint(): string {
  const entries = stocks.map((item: StockItem) => {
    const typeStr =
      item.plan.type === PlanType.PRICE
        ? "PRICE"
        : item.plan.type === PlanType.DIVIDEND
          ? "DIVIDEND"
          : item.plan.type === PlanType.PE
            ? "PE"
            : "EMPTY";
    const base = {
      code: item.code,
      type: typeStr,
      dpy: item.dividendPerYear,
      adj: item.dividendAdjust,
      remark: item.remark,
      mpr: item.plan.maxPositionRatio,
      sh: item.sharesHeld,
    };
    if (item.plan.type === PlanType.PRICE) {
      return {
        ...base,
        entries: item.plan.price.map((e) => ({ v: e.value, q: e.quantity })),
      };
    }
    if (item.plan.type === PlanType.DIVIDEND) {
      return {
        ...base,
        entries: item.plan.dividend.map((e) => ({ v: e.value, q: e.quantity })),
      };
    }
    if (item.plan.type === PlanType.PE) {
      return {
        ...base,
        entries: item.plan.pe.map((e) => ({ v: e.value, q: e.quantity })),
      };
    }
    return { ...base, entries: [] };
  });
  return JSON.stringify(entries);
}

/** 分红数据指纹：仅基于公司 code，公司增删变化时才需重新获取分红 */
function computeDividendFingerprint(): string {
  return JSON.stringify([...stocks.map((s) => s.code)].sort());
}

// ========== 分红数据独立存储（code 变化才失效） ==========

interface DividendStorageData {
  version: string; // 分红指纹
  timestamp: string; // 更新时间
  data: Record<string, ExItem[]>;
}

function saveDividendToStorage() {
  try {
    const data: DividendStorageData = {
      version: computeDividendFingerprint(),
      timestamp: dividendUpdateTime.value,
      data: { ...exListMap.value },
    };
    localStorage.setItem(DIVIDEND_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage 空间不足或写入失败，静默忽略
  }
}

function loadDividendFromStorage(): boolean {
  const raw = localStorage.getItem(DIVIDEND_STORAGE_KEY);
  if (!raw) return false;
  try {
    const data: DividendStorageData = JSON.parse(raw);
    if (data.version !== computeDividendFingerprint()) return false;
    exListMap.value = data.data || {};
    if (data.timestamp) dividendUpdateTime.value = data.timestamp;
    return true;
  } catch {
    // ignore
  }
  return false;
}

// ========== 表结构存储（所有字段变更时失效） ==========

// 按股票 code 去重存储，避免 name/url/exList 重复
interface StockStorage {
  name: string;
  url?: string;
  remark?: string;
  maxPositionRatio?: number;
  sharesHeld?: number;
  change?: number;
  rows: {
    price: number;
    pe: number;
    pb: number;
    dividend: number;
    quantity: number;
  }[];
  exList: ExItem[];
  meta: GroupMeta;
}

interface StorageData {
  version: string;
  stocks: Record<string, StockStorage>;
  customPrice: Record<string, number>;
  customDividend: Record<string, number>;
  customPE: Record<string, number>;
  dynamicUpdateTime?: string;
}

function saveToStorage() {
  try {
    const stocksMap: Record<string, StockStorage> = {};
    const codes: string[] = Array.from(
      new Set(tableData.value.map((r: RowData) => r.code)),
    );
    for (const code of codes) {
      const rows = tableData.value.filter((r: RowData) => r.code === code);
      const first = rows[0];
      stocksMap[code] = {
        name: first.name,
        url: first.url,
        remark: first.remark,
        maxPositionRatio: first.maxPositionRatio,
        sharesHeld: first.sharesHeld,
        change: first.change,
        rows: rows.map((r: RowData) => ({
          price: r.price,
          pe: r.pe,
          pb: r.pb,
          dividend: r.dividend,
          quantity: r.quantity,
        })),
        exList: first.exList,
        meta: groupMetaMap.value[code],
      };
    }
    const data: StorageData = {
      version: computeFingerprint(),
      stocks: stocksMap,
      customPrice: { ...customPrice },
      customDividend: { ...customDividend },
      customPE: { ...customPE },
      dynamicUpdateTime: dynamicUpdateTime.value,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage 空间不足或写入失败，静默忽略
  }
}

function loadFromStorage(): boolean {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const data: StorageData = JSON.parse(raw);
    // 指纹不匹配则丢弃旧缓存，用最新数据重新初始化
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
          pb: r.pb,
          dividend: r.dividend,
          quantity: r.quantity,
          sharesHeld: s.sharesHeld,
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

    if (data.dynamicUpdateTime)
      dynamicUpdateTime.value = data.dynamicUpdateTime;

    // 尝试从分红独立存储加载更新时间（不影响表结构加载成败）
    loadDividendFromStorage();
    return true;
  } catch {
    // ignore
  }
  return false;
}

/**
 * 统一构建 tableData 的处理函数，避免 initData / rebuildTable 重复代码
 * @param dynamicDataList 动态行情数据
 * @param useCachedDividend 是否使用缓存的 exListMap（不重新获取）
 */
async function buildTableData(
  dynamicDataList: DynamicData[],
  useCachedDividend: boolean,
) {
  const stockCodes = stocks.map((v) => v.code);

  if (!useCachedDividend) {
    // 重新获取分红数据（强制刷新，绕过 fetchAllDividendData 的当日缓存）
    const exListMapResult = await fetchAllDividendData(stockCodes, true);
    exListMap.value = exListMapResult;
    dividendUpdateTime.value = new Date().toLocaleString();
    saveDividendToStorage();
  } else if (!Object.keys(exListMap.value).length) {
    // 尝试从分红存储加载
    loadDividendFromStorage();
    if (!Object.keys(exListMap.value).length) {
      // 分红存储也没有，需要重新获取
      const exListMapResult = await fetchAllDividendData(stockCodes);
      exListMap.value = exListMapResult;
      dividendUpdateTime.value = new Date().toLocaleString();
      saveDividendToStorage();
    }
  }

  // 动态数据已获取，记录更新时间
  dynamicUpdateTime.value = new Date().toLocaleString();

  const rate = await getExchangeRate();
  exchangeRate.value = rate;

  // 港股人民币分红按汇率转为港币（字符串中的港币计算值不准确）
  for (const item of stocks) {
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
  for (const item of stocks) {
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
    const item = stocks[i];
    const dynamicData = dynamicDataList.find((v) => v.code === item.code);
    if (dynamicData) {
      const { name, code, price, PE_TTM, PB, change } = dynamicData;
      // 港股 PE_TTM 是以收盘价来算的
      const pricePE = PE_TTM;
      const rawExList = exListMap.value[code] || [];
      const exList = item.dividendPerYear
        ? rawExList.slice(0, item.dividendPerYear)
        : rawExList;
      const dps =
        Math.round(
          exList.reduce(
            (pre: number, cur: ExItem) => pre + getEffectiveEventDps(cur),
            0,
          ) * 100,
        ) / 100;
      const effectiveDps =
        item.dividendAdjust != null
          ? Math.round(dps * item.dividendAdjust * 100) / 100
          : dps;
      groupMetaMap.value[code] = {
        planType: item.plan.type,
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
        pb: PB,
        dividend: effectiveDps / price,
        quantity: 0,
        sharesHeld: item.sharesHeld,
        url: item.url,
        exList,
        change,
        remark: item.remark,
        maxPositionRatio: item.plan.maxPositionRatio,
      });
      if (item.plan.type === PlanType.PRICE) {
        for (let pi = 0; pi < item.plan.price.length; pi++) {
          const v = item.plan.price[pi];
          tableData.value.push({
            name,
            code,
            price: v.value,
            pe: pricePE * (v.value / price),
            pb: PB * (v.value / price),
            dividend: effectiveDps / v.value,
            quantity: v.quantity,
            sharesHeld: item.sharesHeld,
            url: item.url,
            exList,
            remark: item.remark,
            maxPositionRatio: item.plan.maxPositionRatio,
          });
        }
      } else if (item.plan.type === PlanType.DIVIDEND) {
        for (let pi = 0; pi < item.plan.dividend.length; pi++) {
          const v = item.plan.dividend[pi];
          const targetPrice = effectiveDps / v.value;
          tableData.value.push({
            name,
            code,
            price: targetPrice,
            pe: pricePE * (targetPrice / price),
            pb: PB * (targetPrice / price),
            dividend: v.value,
            quantity: v.quantity,
            sharesHeld: item.sharesHeld,
            url: item.url,
            exList,
            remark: item.remark,
            maxPositionRatio: item.plan.maxPositionRatio,
          });
        }
      } else if (item.plan.type === PlanType.PE) {
        for (let pi = 0; pi < item.plan.pe.length; pi++) {
          const v = item.plan.pe[pi];
          const targetPrice = price * (v.value / pricePE);
          tableData.value.push({
            name,
            code,
            price: targetPrice,
            pe: v.value,
            pb: PB * (targetPrice / price),
            dividend: effectiveDps / targetPrice,
            quantity: v.quantity,
            sharesHeld: item.sharesHeld,
            url: item.url,
            exList,
            remark: item.remark,
            maxPositionRatio: item.plan.maxPositionRatio,
          });
        }
      }
    }
  }

  // 初始化 customPrice / customDividend / customPE 为每个公司最后一行的值
  Object.keys(customPrice).forEach((k) => delete customPrice[k]);
  Object.keys(customDividend).forEach((k) => delete customDividend[k]);
  Object.keys(customPE).forEach((k) => delete customPE[k]);
  for (const item of stocks) {
    const rows = tableData.value.filter((r: RowData) => r.code === item.code);
    if (rows.length > 1) {
      const lastRow = rows[rows.length - 1];
      customPrice[item.code] = lastRow.price;
      customDividend[item.code] = lastRow.dividend;
      customPE[item.code] = lastRow.pe;
    }
  }

  saveToStorage();
}

async function refreshData() {
  const stockCodes = stocks.map((v) => v.code);

  // 股票+指数走腾讯（不限频），汇率走免费 API
  const [dynamicDataList, rate] = await Promise.all([
    getDynamicDataFromTencent([...stockCodes, ...indexCodes]),
    getExchangeRate(),
  ]);
  exchangeRate.value = rate;

  if (!tableData.value.length) {
    // 表为空：先尝试从分红存储加载，避免不必要的 API 调用
    tableData.value = [];
    updateIndexData(dynamicDataList);
    return buildTableData(dynamicDataList, true);
  }

  dynamicUpdateTime.value = new Date().toLocaleString();

  for (let i = 0; i < stockCodes.length; i++) {
    const item = stocks[i];
    const dynamicData = dynamicDataList.find((v) => v.code === item.code);
    if (!dynamicData) continue;

    const { price, PE_TTM, PB, change } = dynamicData;
    const code = item.code;

    const pricePE = PE_TTM;
    const meta = groupMetaMap.value[code];
    const dps = meta?.dps || 0;
    const effectiveDps =
      item.dividendAdjust != null
        ? Math.round(dps * item.dividendAdjust * 100) / 100
        : dps;

    groupMetaMap.value[code] = {
      ...(meta || {
        planType: item.plan.type,
        dps: 0,
        effectiveDps: 0,
        dividendAdjust: undefined,
      }),
      pricePE,
      realPrice: price,
    };

    // 更新 tableData 中该 code 的行
    const rows = tableData.value.filter((r: RowData) => r.code === code);
    rows.forEach((row: RowData, index: number) => {
      if (index === 0) {
        // 实时行
        row.price = price;
        row.pe = pricePE;
        row.pb = PB;
        row.dividend = effectiveDps / price;
        row.change = change;
      } else {
        // 计划行
        if (item.plan.type === PlanType.PRICE) {
          const planPrice = item.plan.price[index - 1].value;
          row.price = planPrice;
          row.pe = pricePE * (planPrice / price);
          row.pb = PB * (planPrice / price);
          row.dividend = effectiveDps / planPrice;
        } else if (item.plan.type === PlanType.DIVIDEND) {
          const planDiv = item.plan.dividend[index - 1].value;
          const targetPrice = effectiveDps / planDiv;
          row.price = targetPrice;
          row.pe = pricePE * (targetPrice / price);
          row.pb = PB * (targetPrice / price);
          row.dividend = planDiv;
        } else if (item.plan.type === PlanType.PE) {
          const planPE = item.plan.pe[index - 1].value;
          const targetPrice = price * (planPE / pricePE);
          row.price = targetPrice;
          row.pe = planPE;
          row.pb = PB * (targetPrice / price);
          row.dividend = effectiveDps / targetPrice;
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

  updateIndexData(dynamicDataList);
  saveToStorage();
}

/** 初始化（手动点击）：强制重新获取分红数据 */
async function init() {
  if (loadingPromise.value) return loadingPromise.value;
  loadingPromise.value = (async () => {
    tableData.value = [];
    const stockCodes = stocks.map((v) => v.code);
    // 股票+指数走腾讯（不限频），汇率走免费 API
    const [dynamicDataList, rate] = await Promise.all([
      getDynamicDataFromTencent([...stockCodes, ...indexCodes]),
      getExchangeRate(),
    ]);
    exchangeRate.value = rate;
    updateIndexData(dynamicDataList);
    return buildTableData(dynamicDataList, false);
  })().finally(() => {
    loadingPromise.value = null;
  });
  return loadingPromise.value;
}

/** 刷新实时数据（仅获取动态数据，不重新获取分红） */
async function refresh() {
  if (loadingPromise.value) return loadingPromise.value;
  loadingPromise.value = refreshData().finally(() => {
    loadingPromise.value = null;
  });
  return loadingPromise.value;
}

// 持久化 watch（仅初始化一次）
let watchInitialized = false;
function ensureWatch() {
  if (watchInitialized) return;
  watchInitialized = true;
  watch(
    [customPrice, customDividend, customPE],
    () => {
      if (tableData.value.length) saveToStorage();
    },
    { deep: true },
  );
}

export function useStockPoolData(indexCodeList?: string[]) {
  if (indexCodeList) indexCodes = indexCodeList;
  ensureWatch();
  return {
    tableData,
    exListMap,
    groupMetaMap,
    customPrice,
    customDividend,
    customPE,
    exchangeRate,
    indexDataMap,
    isLoading,
    dividendUpdateTime,
    dynamicUpdateTime,
    init,
    refresh,
    loadFromStorage,
    saveToStorage,
  };
}
