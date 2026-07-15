import axios from "axios";
import { stocksToTencentCodes, toTencentStockCode, isHKCode, isETFCode } from "./helper";
import type { DynamicData } from "./types";

const TENCENT_STOCK_URL = "https://qt.gtimg.cn/q=";

/**
 * 用腾讯 qt.gtimg.cn 获取行情数据，替代东方财富 push2.eastmoney.com
 * 返回与 getDynamicData 一致的 DynamicData[] 格式，调用方无需改动
 *
 * 腾讯接口字段索引（A股）：
 *   [1] 名称  [2] 代码  [3] 现价  [4] 昨收
 *   [32] 涨跌幅(%)  [39] PE_TTM  [44] 总市值(亿)
 *   [46] 市净率  [72] 总股本
 * 
 * 港股（r_hk）字段位置有差异：
 *   [57] PE_TTM           [58] 市净率           [69] 总股本
 *   ([44] 总市值亿与 A 股相同)
 */
export async function getDynamicDataFromTencent(
  codes: string[],
): Promise<DynamicData[]> {
  if (!codes.length) return [];

  const tencentCodesStr = stocksToTencentCodes(codes);

  const res = await axios.get(TENCENT_STOCK_URL, {
    params: {
      q: tencentCodesStr,
      fmt: "json",
    },
  });

  const raw = res.data;

  return codes
    .map((originalCode) => {
      const tcKey = toTencentStockCode(originalCode);
      const item = raw[tcKey];

      if (!item || !Array.isArray(item)) {
        // 该代码无数据，返回占位
        return null;
      }

      const isHK = isHKCode(originalCode);
      const isETF = isETFCode(originalCode);

      // 港股字段更多，需要更大的数组长度（PB 在 [58]，总股本在 [69]）
      if (item.length < (isHK ? 70 : 40)) {
        return null;
      }

      // 指数代码保留原格式（如 "1.000001"），避免与个股 code 冲突
      const code: string = originalCode.includes(".")
        ? originalCode
        : (item[2] || originalCode);

      // name
      const name = String(item[1] || code);

      // price: 腾讯返回实际价格，与东方财富 /100 后一致
      const price = parseFloat(item[3]) || 0;

      // prevClose: 东方财富返回原始值（未除），此处乘倍数以匹配
      const prevCloseRaw = parseFloat(item[4]) || 0;
      const prevClose =
        isHK || isETF ? prevCloseRaw * 1000 : prevCloseRaw * 100;

      // change: 腾讯返回百分比数值（如 2.98），前端直接拼 % 显示
      const change = parseFloat(item[32]) || 0;

      // PE_TTM: A 股 [39]，港股 [57]（返回字段位置不同）
      const PE_TTM = isHK ? (parseFloat(item[57]) || 0) : (parseFloat(item[39]) || 0);

      // 总市值（亿）
      const marketValue = parseFloat(item[44]) || 0;

      // 市净率: A 股 [46]，港股 [58]
      const PB = isHK ? (parseFloat(item[58]) || 0) : (parseFloat(item[46]) || 0);

      // 总股本: A 股 [72]，港股 [69]
      const totalSharesOutstanding = isHK
        ? (parseInt(item[69], 10) || 0)
        : (parseInt(item[72], 10) || 0);

      return {
        code,
        name,
        change,
        prevClose,
        price,
        marketValue,
        PB,
        PE_TTM,
        totalSharesOutstanding,
      };
    })
    .filter(Boolean) as DynamicData[];
}
