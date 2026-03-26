import {
  ProfitValuationGrowthType,
  StockLevel,
  StockType,
  ValuationType,
  type StockItem,
} from "../index";

const portStockData: StockItem[] = [
  {
    type: StockType.A,
    name: "青岛港",
    code: "601298",
    level: StockLevel.CORE,
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 7.27,
      // type: ValuationType.PROFIT,
      // specialOffer: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0],
      //   discount: 0.8,
      // },
      // conservative: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.03],
      //   discount: 0.8,
      // },
      // neutral: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.05],
      //   discount: 0.8,
      // },
      // optimistic: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.08],
      //   discount: 0.8,
      // },
      // backYearsNum: 10,
    },
    hkMarketConfig: {
      code: "06198",
      dividendTaxRate: 0.8,
    },
  },
  {
    type: StockType.HK,
    name: "青岛港",
    code: "06198",
    level: StockLevel.CORE,
    allocation: 0.05,
    sharesPerLot: 500,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 5.76,
      // type: ValuationType.PROFIT,
      // specialOffer: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0],
      //   discount: 0.8,
      // },
      // conservative: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.03],
      //   discount: 0.8,
      // },
      // neutral: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.05],
      //   discount: 0.8,
      // },
      // optimistic: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.08],
      //   discount: 0.8,
      // },
      // backYearsNum: 10,
    },
  },
  {
    type: StockType.A,
    name: "上港集团",
    code: "600018",
    level: StockLevel.MARGIN,
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 3.93,
      // type: ValuationType.PROFIT,
      // specialOffer: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0],
      //   discount: 0.8,
      // },
      // conservative: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.03],
      //   discount: 0.8,
      // },
      // neutral: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.05],
      //   discount: 0.8,
      // },
      // optimistic: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.08],
      //   discount: 0.8,
      // },
      // backYearsNum: 10,
    },
  },
  {
    type: StockType.A,
    name: "唐山港",
    code: "601000",
    level: StockLevel.ROTATION,
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 3.08,
      // type: ValuationType.PROFIT,
      // specialOffer: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.2, 0],
      //   discount: 0.8,
      // },
      // conservative: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.2, 0.02],
      //   discount: 0.8,
      // },
      // neutral: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.2, 0.03],
      //   discount: 0.8,
      // },
      // optimistic: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.2, 0.04],
      //   discount: 0.8,
      // },
      // backYearsNum: 10,
    },
  },
  {
    type: StockType.B,
    name: "招港B",
    code: "201872",
    level: StockLevel.MARGIN,
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 12.38,
    },
  },
  {
    type: StockType.A,
    name: "招商港口",
    code: "001872",
    level: StockLevel.MARGIN,
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 13.7,
    },
  },
  {
    type: StockType.A,
    name: "宁波港",
    code: "601018",
    level: StockLevel.MARGIN,
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 2.36,
    },
  },
];

export { portStockData };
