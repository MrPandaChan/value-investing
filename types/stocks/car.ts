import {
  ProfitValuationGrowthType,
  StockType,
  ValuationType,
  type StockItem,
} from "../index";

const carStockData: StockItem[] = [
  {
    type: StockType.A,
    name: "比亚迪",
    code: "002594",
    allocation: 0.1,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 67.32,
      // type: ValuationType.PROFIT,
      // specialOffer: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.12, 0.05],
      // },
      // conservative: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.12, 0.1],
      // },
      // neutral: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.12, 0.12],
      // },
      // optimistic: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.12, 0.15],
      // },
      // backYearsNum: 10,
    },
  },
  {
    type: StockType.A,
    name: "宇通客车",
    code: "600066",
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 24.48,
      // type: ValuationType.PROFIT,
      // specialOffer: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.35, 0],
      //   discount: 0.9,
      // },
      // conservative: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.35, 0.03],
      //   discount: 0.9,
      // },
      // neutral: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.35, 0.08],
      //   discount: 0.9,
      // },
      // optimistic: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.35, 0.1],
      //   discount: 0.9,
      // },
      // backYearsNum: 10,
    },
  },
  {
    type: StockType.A,
    name: "福耀玻璃",
    code: "600660",
    allocation: 0.1,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 45.35,
      // type: ValuationType.PROFIT,
      // specialOffer: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0],
      // },
      // conservative: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.08, 0.05],
      // },
      // neutral: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.1, 0.08],
      // },
      // optimistic: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.13, 0.1],
      // },
      // backYearsNum: 10,
    },
    hkMarketConfig: {
      code: "03606",
      dividendTaxRate: 0.8,
    },
  },
  {
    type: StockType.HK,
    name: "福耀玻璃",
    code: "03606",
    allocation: 0.1,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 36.3,
    },
  },
  {
    type: StockType.A,
    name: "宁德时代",
    code: "300750",
    allocation: 0.1,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 255.18,
    },
  },
  {
    type: StockType.HK,
    name: "宁德时代",
    code: "03750",
    allocation: 0.1,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 255.18,
    },
  },
  {
    type: StockType.A,
    name: "三七互娱",
    code: "002555",
    allocation: 0.1,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 13.98,
    },
  },
];

export { carStockData };
