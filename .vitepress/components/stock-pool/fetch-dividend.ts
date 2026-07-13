import axios from "axios";
import { isHKCode, toSECUCODE, v } from "../../../fetch-data/helper";
import { FINANCE_URL_V1 } from "../../../fetch-data/fetch-stock-data";

export interface DividendMainResponse {
  EX_DIVIDEND_DATE: string; // 除权除息日 "2020-07-16 00:00:00"
  IMPL_PLAN_NEWPROFILE: string; // '10派2.031195元(实施方案)'
  PAY_CASH_DATE: string; // 派息日 '2020-07-16 00:00:00'
}

export interface HKDividendMainResponse {
  EX_DIVIDEND_DATE: string; // 除净日 '2025/06/12'
  PLAN_EXPLAIN: string; // 分红方案 '每股派港币0.66元'
  DIVIDEND_DATE: string; // 发放日 '2025/07/11'
}

export interface ExItem {
  dps: number;
  exDate: string;
  payDate: string; // 派息日
  bonusRatio?: number; // 转送股比例，如 3 表示 10转3，已除权后每股分红需除以 (1+bonusRatio/10)
  planRaw?: string; // 原始分红方案文本，如 "10转3派25元(实施方案)"
  isRmb?: boolean; // 港股人民币分红：dps 为人民币数值，需用汇率转为港币
}

/**
 * 解析A股分红方案的每股分红及转股比例
 * e.g., '10派2.031195元(实施方案)' -> { dps: 0.2031195 }
 * e.g., '10转3股派25元(实施方案)' -> { dps: 2.5, bonusRatio: 3 }
 */
function getADps(str: string): { dps: number; bonusRatio?: number } {
  let bonusRatio: number | undefined

  // 提取转/送股比例，如 "10转3股"、"10送2股"、"10转3"（不带股字）
  const bonusMatch = str.match(/(?:转|送)(\d+\.?\d*)\s*股?/)
  if (bonusMatch) {
    const r = parseFloat(bonusMatch[1])
    if (!isNaN(r) && r > 0) bonusRatio = r
  }

  // 提取派现金额
  const match = str.match(/派.*?(\d+\.?\d*)\s*元/)
  if (!match) return { dps: 0 }
  const result = parseFloat(match[1])
  const dps = isNaN(result) ? 0 : result / 10

  return { dps, bonusRatio }
}

/**
 * 解析港股分红方案的每股分红
 * 普通格式: '每股派港币0.66元' -> { dps: 0.66, isRmb: false }
 * 人民币格式: '每股派人民币0.1988元(相当于港币0.224986元(计算值))'
 *   -> 提取人民币数值 0.1988，标记 isRmb: true，由调用方通过汇率转为港币
 */
function getHKDps(str: string): { dps: number; isRmb: boolean } {
  // 如果是人民币分红，提取人民币数值（括号内的港币计算值不准确）
  if (str.includes("人民币") && str.includes("港币")) {
    const rmbMatch = str.match(/人民币(\d+\.?\d*)元/);
    if (rmbMatch) return { dps: parseFloat(rmbMatch[1]), isRmb: true };
  }
  // 默认提取第一个数字作为港币每股分红
  const val = str.replace(/^.*?(\d+\.?\d*).*?$/, "$1");
  const result = parseFloat(val);
  return { dps: isNaN(result) ? 0 : result, isRmb: false };
}

/**
 * 格式化日期字符串
 * "2020-07-16 00:00:00" -> "2020-07-16"
 * "2025/06/12" -> "2025-06-12"
 * "" -> ""
 */
function formatExDate(dateStr: string): string {
  if (!dateStr) return "-";
  return dateStr.replace(/\//g, "-").split(" ")[0];
}

/**
 * 计算每股分红的有效值，对有转送股的已除权事件做稀释调整
 * - 已除权（exDate 已过）：股价已反映稀释，dps 需除以 (1 + bonusRatio/10)
 * - 未除权（exDate 未到）：事件未发生，dps 维持原值
 */
export function getEffectiveEventDps(ex: ExItem): number {
  if (!ex.bonusRatio) return ex.dps
  // 解析除权日期，判断是否已除权
  const exDate = _parseDateSafe(ex.exDate)
  if (!exDate || exDate > new Date()) return ex.dps
  // 已除权，每股分红需稀释：持有股数变多，每股实际分到的现金变少
  return ex.dps / (1 + ex.bonusRatio / 10)
}

/** 安全解析日期字符串，失败返回 null */
function _parseDateSafe(s: string): Date | null {
  if (!s || s === "-") return null
  const normalized = s.replace(/\//g, "-")
  const d = new Date(normalized)
  return isNaN(d.getTime()) ? null : d
}

/**
 * 获取单只股票的分红（除权除息）数据
 * 返回最近一年内的数据：包含还未除权除息（未来）和最近一年内已除权除息的
 */
export async function fetchDividendData(code: string): Promise<ExItem[]> {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  if (isHKCode(code)) {
    return fetchHKDividend(code, oneYearAgo);
  }
  return fetchADividend(code, oneYearAgo);
}

/**
 * A股分红数据
 */
async function fetchADividend(
  code: string,
  oneYearAgo: Date,
): Promise<ExItem[]> {
  const SECUCODE = toSECUCODE(code);

  const res = await axios.get(FINANCE_URL_V1, {
    params: {
      reportName: "RPT_F10_DIVIDEND_MAIN",
      columns: "EX_DIVIDEND_DATE,IMPL_PLAN_NEWPROFILE,PAY_CASH_DATE",
      quoteColumns: "",
      filter: `(SECUCODE="${SECUCODE}")(IS_UNASSIGN="0")`,
      pageNumber: 1,
      pageSize: 4,
      sortTypes: -1,
      sortColumns: "NOTICE_DATE",
      source: "HSF10",
      client: "PC",
      v: v(),
    },
  });

  if (!res.data.success) return [];

  return res.data.result.data
    .filter((item: DividendMainResponse) => {
      // 除权除息日为空表示还未确定，不能忽略
      if (!item.EX_DIVIDEND_DATE) return true;
      const exDate = new Date(item.EX_DIVIDEND_DATE);
      return exDate >= oneYearAgo;
    })
    .map((item: DividendMainResponse) => {
      const str = item.IMPL_PLAN_NEWPROFILE || "";
      const { dps, bonusRatio } = getADps(str);
      if (dps === 0 && str) {
        console.warn(`[A股分红解析为0] ${code}: ${str}`);
      }
      return {
        dps,
        bonusRatio: bonusRatio ?? undefined,
        planRaw: str || undefined,
        exDate: formatExDate(item.EX_DIVIDEND_DATE),
        payDate: formatExDate(item.PAY_CASH_DATE),
      };
    })
    .filter((item: ExItem) => item.dps > 0);
}

/**
 * 港股分红数据
 */
async function fetchHKDividend(
  code: string,
  oneYearAgo: Date,
): Promise<ExItem[]> {
  const SECUCODE = toSECUCODE(code);

  const res = await axios.get(FINANCE_URL_V1, {
    params: {
      reportName: "RPT_HKF10_MAIN_DIVBASIC",
      columns: "EX_DIVIDEND_DATE,PLAN_EXPLAIN,DIVIDEND_DATE",
      quoteColumns: "",
      filter: `(SECUCODE="${SECUCODE}")(IS_BFP="0")`,
      pageNumber: 1,
      pageSize: 4,
      sortTypes: "-1,-1",
      sortColumns: "NOTICE_DATE,EX_DIVIDEND_DATE",
      source: "F10",
      client: "PC",
      v: v(),
    },
  });

  if (!res.data.success) return [];

  return res.data.result.data
    .filter((item: HKDividendMainResponse) => {
      // 除权除息日为空表示还未确定，不能忽略
      if (!item.EX_DIVIDEND_DATE) return true;
      // 港股日期格式: "2025/06/12"
      const exDate = new Date(item.EX_DIVIDEND_DATE);
      return exDate >= oneYearAgo;
    })
    .map((item: HKDividendMainResponse) => {
      const str = item.PLAN_EXPLAIN || "";
      const { dps, isRmb } = getHKDps(str);
      if (dps === 0 && str) {
        console.warn(`[港股分红解析为0] ${code}: ${str}`);
      }
      return {
        dps,
        isRmb: isRmb || undefined,
        exDate: formatExDate(item.EX_DIVIDEND_DATE),
        payDate: formatExDate(item.DIVIDEND_DATE),
      };
    })
    .filter((item: ExItem) => item.dps > 0);
}

/**
 * 批量获取多只股票的分红数据
 * 带 localStorage 缓存：如果 codes 未变且同一天内，直接返回缓存数据
 */
const CACHE_KEY = "dividend_cache";

interface CacheData {
  codesKey: string;
  date: string; // "YYYY-MM-DD"
  data: Record<string, ExItem[]>;
}

function readCache(): CacheData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CacheData;
  } catch {
    return null;
  }
}

function writeCache(cache: CacheData): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage 满或不可用，静默忽略
  }
}

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getCodesKey(codes: string[]): string {
  return [...codes].sort().join(",");
}

export async function fetchAllDividendData(
  codes: string[],
  forceRefresh = false,
): Promise<Record<string, ExItem[]>> {
  const today = getTodayStr();
  const codesKey = getCodesKey(codes);

  // 从 localStorage 读取缓存，codes 没变且同一天则直接返回（除非强制刷新）
  if (!forceRefresh) {
    const cached = readCache();
    if (cached && cached.codesKey === codesKey && cached.date === today) {
      return cached.data;
    }
  }

  const results = await Promise.all(
    codes.map(async (code) => {
      const data = await fetchDividendData(code);
      return { code, data };
    }),
  );

  const map: Record<string, ExItem[]> = {};
  for (const { code, data } of results) {
    map[code] = data;
  }

  // 写入 localStorage 缓存
  writeCache({ codesKey, date: today, data: map });

  return map;
}
