import axios from "axios";
import { isHKCode, toSECUCODE, v } from "../../../fetch-data/helper";
import { FINANCE_URL_V1 } from "../../../fetch-data/fetch-stock-data";

export interface DividendMainResponse {
  EX_DIVIDEND_DATE: string; // 除权除息日 "2020-07-16 00:00:00"
  IMPL_PLAN_NEWPROFILE: string; // '10派2.031195元(实施方案)'
}

export interface HKDividendMainResponse {
  EX_DIVIDEND_DATE: string; // 除净日 '2025/06/12'
  PLAN_EXPLAIN: string; // 分红方案 '每股派港币0.66元'
}

export interface ExItem {
  dps: number;
  exDate: string;
  isRmb?: boolean; // 港股人民币分红：dps 为人民币数值，需用汇率转为港币
}

/**
 * 解析A股分红方案的每股分红
 * e.g., '10派2.031195元(实施方案)' -> 0.2031195
 */
function getADps(str: string): number {
  const val = str.replace(/^.*?派(.*?)元.*?/, "$1");
  const result = parseFloat(val);
  return isNaN(result) ? 0 : result / 10;
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
      columns: "EX_DIVIDEND_DATE,IMPL_PLAN_NEWPROFILE",
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
    .map((item: DividendMainResponse) => ({
      dps: getADps(item.IMPL_PLAN_NEWPROFILE || ""),
      exDate: formatExDate(item.EX_DIVIDEND_DATE),
    }))
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
      columns: "EX_DIVIDEND_DATE,PLAN_EXPLAIN",
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
      const { dps, isRmb } = getHKDps(item.PLAN_EXPLAIN || "");
      return {
        dps,
        isRmb: isRmb || undefined,
        exDate: formatExDate(item.EX_DIVIDEND_DATE),
      };
    })
    .filter((item: ExItem) => item.dps > 0);
}

/**
 * 批量获取多只股票的分红数据
 */
export async function fetchAllDividendData(
  codes: string[],
): Promise<Record<string, ExItem[]>> {
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
  return map;
}
