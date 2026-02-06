import { ProfitValuationGrowthType, type StockItem } from "../index";

const portStockData: StockItem[] = [
  {
    name: "青岛港",
    code: "601298",
    allocation: 0.05,
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0],
        discount: 0.8,
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.03],
        discount: 0.8,
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.05],
        discount: 0.8,
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.08],
        discount: 0.8,
      },
      backYearsNum: 10,
    },
    hkMarketConfig: {
      code: "06198",
      dividendTaxRate: 0.8,
    },
  },
  {
    name: "上港集团",
    code: "600018",
    allocation: 0.05,
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0],
        discount: 0.8,
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.03],
        discount: 0.8,
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.05],
        discount: 0.8,
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.08],
        discount: 0.8,
      },
      backYearsNum: 10,
    },
  },
  {
    name: "唐山港",
    code: "601000",
    allocation: 0,
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.2, 0],
        discount: 0.8,
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.2, 0.02],
        discount: 0.8,
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.2, 0.03],
        discount: 0.8,
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.2, 0.04],
        discount: 0.8,
      },
      backYearsNum: 10,
    },
  },
];

export { portStockData };
