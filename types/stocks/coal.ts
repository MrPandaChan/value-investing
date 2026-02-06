import { ProfitValuationGrowthType, type StockItem } from "../index";

const coalStockData: StockItem[] = [
  {
    name: "中国神华",
    code: "601088",
    allocation: 0.1,
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.15, -0.1, 0],
        discount: 0.9,
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.15, -0.1, 0],
        discount: 0.9,
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.15, -0.1, 0.02],
        discount: 0.9,
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.15, -0.1, 0.04],
        discount: 0.9,
      },
      backYearsNum: 10,
    },
  },
  {
    name: "陕西煤业",
    code: "601225",
    allocation: 0.05,
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.2, -0.1, 0],
        discount: 0.9,
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.2, -0.1, 0],
        discount: 0.9,
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.2, -0.1, 0.02],
        discount: 0.9,
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.2, -0.1, 0.04],
        discount: 0.9,
      },
      backYearsNum: 10,
    },
  },
  {
    name: "中煤能源",
    code: "601898",
    allocation: 0.05,
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.2, -0.1, 0],
        discount: 0.9,
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.2, -0.1, 0],
        discount: 0.9,
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.2, -0.1, 0.02],
        discount: 0.9,
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.2, -0.1, 0.04],
        discount: 0.9,
      },
      backYearsNum: 10,
    },
  },
  {
    name: "兖矿能源",
    code: "600188",
    allocation: 0.02,
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.25, -0.1, 0],
        discount: 0.9,
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.25, -0.1, 0],
        discount: 0.9,
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.25, -0.1, 0.02],
        discount: 0.9,
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.25, -0.1, 0.04],
        discount: 0.9,
      },
      backYearsNum: 10,
    },
  },
];

export { coalStockData };
