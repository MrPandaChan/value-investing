import { StockLevel, StockType, ValuationType, type StockItem } from "../index";

/**
 * 青岛啤酒
 *
 * 2025 年度每股派人民币 2.35 元，按 5.5% 股息率反推参考价：
 * 2.35 / 0.055 ≈ 42.73
 *
 * 不用 DIVIDEND 估值的原因：A/H 两地上市时 totalDividend 是全口径分红，
 * 而动态数据里的总股数只取 A 股口径，算出的锚会偏高。
 */
const beerStockData: StockItem[] = [
  {
    type: StockType.A,
    name: "青岛啤酒",
    code: "600600",
    level: StockLevel.ROTATION,
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 42.73,
    },
    hkMarketConfig: {
      code: "00168",
      dividendTaxRate: 0.8,
    },
  },
  {
    type: StockType.HK,
    name: "青岛啤酒",
    code: "00168",
    sharesPerLot: 2000,
    level: StockLevel.ROTATION,
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 42.73,
    },
  },
];

export { beerStockData };
