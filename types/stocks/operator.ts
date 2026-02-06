import { ProfitValuationGrowthType, type StockItem } from "../index";

const operatorStockData: StockItem[] = [
  {
    name: "中国移动",
    code: "600941",
    allocation: 0.1,
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.02, 0.02, 0],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.04, 0.02, 0.02],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.04, 0.02, 0.03],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.04, 0.03, 0.04],
      },
      backYearsNum: 10,
    },
    hkMarketConfig: {
      code: "00941",
      dividendTaxRate: 0.72,
    },
  },
  {
    name: "中国电信",
    code: "601728",
    allocation: 0,
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.05, 0.03, 0],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.05, 0.03, 0.02],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.05, 0.03, 0.03],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.05, 0.04, 0.04],
      },
      backYearsNum: 10,
    },
  },
  {
    name: "中国联通",
    code: "600050",
    allocation: 0,
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.05, 0.03, 0],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.05, 0.03, 0.02],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.05, 0.03, 0.03],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.05, 0.04, 0.04],
      },
      backYearsNum: 10,
    },
  },
];

export { operatorStockData };
