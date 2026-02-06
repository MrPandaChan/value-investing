import { ProfitValuationGrowthType, type StockItem } from "../index";

const carStockData: StockItem[] = [
  {
    name: "比亚迪",
    code: "002594",
    allocation: 0.1,
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.12, 0.05],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.12, 0.1],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.12, 0.12],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.12, 0.15],
      },
      backYearsNum: 10,
    },
  },
  {
    name: "宇通客车",
    code: "600066",
    allocation: 0.05,
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.35, 0],
        discount: 0.9,
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.35, 0.03],
        discount: 0.9,
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.35, 0.08],
        discount: 0.9,
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.35, 0.1],
        discount: 0.9,
      },
      backYearsNum: 10,
    },
  },
  {
    name: "福耀玻璃",
    code: "600660",
    allocation: 0.1,
    profitValuationConfig: {
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.3, 0.1],
      },
      backYearsNum: 10,
    },
    hkMarketConfig: {
      code: "03606",
      dividendTaxRate: 0.8,
    },
  },
];

export { carStockData };
