import { ProfitValuationGrowthType, type StockItem } from "../index";

const oilStockData: StockItem[] = [
  {
    name: "中国海油",
    code: "600938",
    allocation: 0.2,
    profitValuationConfig: {
      neutral: {
        type: ProfitValuationGrowthType.PROFIT,
        data: [1200],
      },
      backYearsNum: 8,
    },
    hkMarketConfig: {
      code: "00883",
      dividendTaxRate: 0.72,
    },
  },
  {
    name: "中国石油",
    code: "601857",
    allocation: 0,
    profitValuationConfig: {
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0],
      },
      backYearsNum: 8,
    },
  },
  {
    name: "中国石化",
    code: "600028",
    allocation: 0,
    profitValuationConfig: {
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0],
      },
      backYearsNum: 8,
    },
  },
];

export { oilStockData };
