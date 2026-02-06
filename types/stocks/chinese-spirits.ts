import { ProfitValuationGrowthType, type StockItem } from "../index";

const chineseSpiritsStockData: StockItem[] = [
  {
    name: "贵州茅台",
    code: "600519",
    allocation: 0.2,
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.06, 0],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.06, 0.03],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.06, 0.03, 0.06],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.06, 0.09],
      },
      backYearsNum: 10,
    },
  },
  {
    name: "五粮液",
    code: "000858",
    allocation: 0.05,
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.25, -0.15, 0],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.25, -0.15, 0.02],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.25, -0.15, 0.05],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.25, -0.15, 0.07],
      },
      backYearsNum: 10,
    },
  },
  {
    name: "泸州老窖",
    code: "000568",
    allocation: 0.05,
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.25, -0.1, 0],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.25, -0.1, 0.02],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.25, -0.1, 0.05],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.25, -0.05, 0.07],
      },
      backYearsNum: 10,
    },
  },
  {
    name: "古井贡酒",
    code: "000596",
    allocation: 0.05,
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.3, -0.1, 0],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.3, -0.1, 0.05],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.3, -0.1, 0.05],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.3, -0.1, 0.07],
      },
      backYearsNum: 10,
    },
    bMarketConfig: {
      code: "200596",
      discount: 0.7,
    },
  },
  {
    name: "山西汾酒",
    code: "600809",
    allocation: 0.05,
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0, 0.05],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0, 0.09],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0, 0.12],
      },
      backYearsNum: 10,
    },
  },
];

export { chineseSpiritsStockData };
