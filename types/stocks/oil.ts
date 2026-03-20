import {
  ProfitValuationGrowthType,
  StockType,
  ValuationType,
  type StockItem,
} from "../index";

const oilStockData: StockItem[] = [
  {
    type: StockType.A,
    name: "中国海油",
    code: "600938",
    allocation: 0.2,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 19.17,
      // type: ValuationType.PROFIT,
      // specialOffer: {
      //   type: ProfitValuationGrowthType.PROFIT,
      //   data: [1000],
      // },
      // conservative: {
      //   type: ProfitValuationGrowthType.PROFIT,
      //   data: [1100],
      // },
      // neutral: {
      //   type: ProfitValuationGrowthType.PROFIT,
      //   data: [1200],
      // },
      // optimistic: {
      //   type: ProfitValuationGrowthType.PROFIT,
      //   data: [1400],
      // },
      // backYearsNum: 8,
    },
    hkMarketConfig: {
      code: "00883",
      dividendTaxRate: 0.72,
    },
  },
  {
    type: StockType.HK,
    name: "中国海油",
    code: "00883",
    allocation: 0.2,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 15.48,
    },
  },
  {
    type: StockType.A,
    name: "中国石油",
    code: "601857",
    allocation: 0,
    valuationConfig: {
      type: ValuationType.PROFIT,
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0, 0, 0],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0, 0, 0.02],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0, 0, 0.03],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0, 0, 0.04],
      },
      backYearsNum: 8,
    },
  },
  {
    type: StockType.A,
    name: "中国石化",
    code: "600028",
    allocation: 0,
    valuationConfig: {
      type: ValuationType.PROFIT,
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0, 0, 0],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0, 0, 0.02],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0, 0, 0.03],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0, 0, 0.04],
      },
      backYearsNum: 8,
    },
  },
];

export { oilStockData };
