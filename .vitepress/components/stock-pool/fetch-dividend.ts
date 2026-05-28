import axios from "axios";
import { isHKCode, toSECUCODE, v } from "../../../fetch-data/helper";
import { FINANCE_URL_V1 } from "../../../fetch-data/fetch-stock-data";

export interface ExItem {
  dps: number;
  exDate: string;
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
 * e.g., '每股派港币0.66元' -> 0.66
 */
function getHKDps(str: string): number {
  const val = str.replace(/^.*?(\d+\.?\d*).*?$/, "$1");
  const result = parseFloat(val);
  return isNaN(result) ? 0 : result;
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
      columns: "ALL",
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
    .filter((item: any) => {
      // 除权除息日为空表示还未确定，不能忽略
      if (!item.EX_DIVIDEND_DATE) return true;
      const exDate = new Date(item.EX_DIVIDEND_DATE);
      return exDate >= oneYearAgo;
    })
    .map((item: any) => ({
      dps: getADps(item.IMPL_PLAN_NEWPROFILE || ""),
      exDate: formatExDate(item.EX_DIVIDEND_DATE),
    }))
    .filter((item) => item.dps > 0);
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
      columns:
        "SECURITY_CODE,UPDATE_DATE,REPORT_TYPE,EX_DIVIDEND_DATE,DIVIDEND_DATE,TRANSFER_END_DATE,YEAR,PLAN_EXPLAIN,IS_BFP",
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
    .filter((item: any) => {
      // 除权除息日为空表示还未确定，不能忽略
      if (!item.EX_DIVIDEND_DATE) return true;
      // 港股日期格式: "2025/06/12"
      const exDate = new Date(item.EX_DIVIDEND_DATE);
      return exDate >= oneYearAgo;
    })
    .map((item: any) => ({
      dps: getHKDps(item.PLAN_EXPLAIN || ""),
      exDate: formatExDate(item.EX_DIVIDEND_DATE),
    }))
    .filter((item) => item.dps > 0);
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
