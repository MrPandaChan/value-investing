import {
  ProfitValuationGrowthType,
  StockLevel,
  StockType,
  ValuationType,
  type StockItem,
} from "../index";

const operatorStockData: StockItem[] = [
  {
    type: StockType.A,
    name: "中国移动",
    code: "600941",
    level: StockLevel.CORE,
    allocation: 0.1,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 65.69,
      // type: ValuationType.PROFIT,
      // specialOffer: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.02, 0.02, 0],
      // },
      // conservative: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.04, 0.02, 0.02],
      // },
      // neutral: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.04, 0.02, 0.03],
      // },
      // optimistic: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.04, 0.03, 0.04],
      // },
      // backYearsNum: 10,
    },
    hkMarketConfig: {
      code: "00941",
      dividendTaxRate: 0.72,
    },
  },
  {
    type: StockType.HK,
    name: "中国移动",
    code: "00941",
    level: StockLevel.CORE,
    allocation: 0.1,
    sharesPerLot: 500,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 52.71,
    },
  },
  {
    type: StockType.A,
    name: "中国电信",
    code: "601728",
    level: StockLevel.MARGIN,
    allocation: 0,
    valuationConfig: {
      type: ValuationType.PROFIT,
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
    type: StockType.A,
    name: "中国联通",
    code: "600050",
    level: StockLevel.MARGIN,
    allocation: 0,
    valuationConfig: {
      type: ValuationType.PROFIT,
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
    type: StockType.HK,
    name: "中国铁塔",
    code: "00788",
    level: StockLevel.MARGIN,
    allocation: 0.05,
    sharesPerLot: 500,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 8.66,
      // type: ValuationType.PROFIT,
      // specialOffer: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.05, 0.03, 0],
      // },
      // conservative: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.05, 0.03, 0.02],
      // },
      // neutral: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.05, 0.03, 0.03],
      // },
      // optimistic: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.05, 0.04, 0.04],
      // },
      // backYearsNum: 10,
    },
  },
];

export { operatorStockData };
