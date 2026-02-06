import { ProfitValuationGrowthType, type StockItem } from "../index";

const otherStockData: StockItem[] = [
  {
    name: "科沃斯",
    code: "603486",
    allocation: 0,
  },
  {
    name: "中远海控",
    code: "601919",
    allocation: 0.05,
    profitValuationConfig: {
      conservative: {
        type: ProfitValuationGrowthType.PROFIT,
        data: [150],
      },
      backYearsNum: 7,
    },
  },
  {
    name: "盐湖股份",
    code: "000792",
    allocation: 0.05,
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.35, 0.03],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.35, 0.08],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.35, 0.1],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.35, 0.12],
      },
      backYearsNum: 10,
    },
  },
  {
    name: "爱玛科技",
    code: "603529",
    allocation: 0,
  },
  {
    name: "九号公司",
    code: "689009",
    allocation: 0,
  },
  {
    name: "顺丰控股",
    code: "002352",
    allocation: 0,
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.03],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.07],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.1],
      },
      backYearsNum: 10,
    },
  },
  {
    name: "永新股份",
    code: "002014",
    allocation: 0.05,
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0, 0.03],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0, 0.05],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0, 0.07],
      },
      backYearsNum: 10,
    },
  },
];

export { otherStockData };
