/**
 * TODO: plan.ts 和 stocks.ts 中的基础数据都合并到一个文件中统一设置，相当于有一个基础数据库
 *
 * 实际上可以完全共享，PlanItem 新增 sharesHeld 即可
 */

interface StockItem {
  code: string;
  sharesHeld: number; // 持有股数
  url?: string;
  remark?: string;
  /**
   * 年分红调整系数，与年分红相乘得到调整后年分红，
   * 调整后年分红用于股息率反推股价
   */
  dividendAdjust?: number;
  /** 一年分红次数，设置后仅展示和计算最新的 n 条分红数据 */
  dividendPerYear?: number;
}

const stocks: StockItem[] = [
  // 腾讯控股
  {
    code: "00700",
    sharesHeld: 300,
    dividendAdjust: 0.8,
  },
];

export { stocks };
