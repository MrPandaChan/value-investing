import { ProfitValuationGrowthType, type StockItem } from "../index";

const electricityStockData: StockItem[] = [
  {
    name: "长江电力",
    code: "600900",
    allocation: 0.1,
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0, 0, 0, 0],
        discount: 0.9,
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0, 0, 0, 0.02],
        discount: 0.9,
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0, 0, 0, 0.02, 0.04],
        discount: 0.9,
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0, 0, 0, 0.02, 0.06],
        discount: 0.9,
      },
      backYearsNum: 10,
    },
  },
  {
    name: "国投电力",
    code: "600886",
    allocation: 0.1,
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.1, -0.05, 0],
        discount: 0.9,
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.1, -0.05, 0.02],
        discount: 0.9,
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.1, -0.05, 0.04],
        discount: 0.9,
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.1, -0.05, 0.06],
        discount: 0.9,
      },
      backYearsNum: 10,
    },
  },
];

export { electricityStockData };
