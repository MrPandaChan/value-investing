import { ProfitValuationGrowthType, type StockItem } from "../index";

const homeApplianceStockData: StockItem[] = [
  {
    name: "格力电器",
    code: "000651",
    allocation: 0.05,
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.05, -0.08, -0.05, 0],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.05, -0.05, 0],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.05, -0.03, 0],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.05, 0, 0.05],
      },
      backYearsNum: 8,
    },
  },
  {
    name: "海尔智家",
    code: "600690",
    allocation: 0.1,
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.1, 0],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.1, 0.05],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.1, 0.07],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.1, 0.09],
      },
      backYearsNum: 8.5,
    },
  },
  {
    name: "美的集团",
    code: "000333",
    allocation: 0.1,
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.05],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.07],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.09],
      },
      backYearsNum: 9,
    },
  },
];

export { homeApplianceStockData };
