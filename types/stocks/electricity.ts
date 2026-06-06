import {
  ProfitValuationGrowthType,
  StockLevel,
  StockType,
  ValuationType,
  type StockItem,
} from "../index";

const electricityStockData: StockItem[] = [
  {
    type: StockType.A,
    name: "长江电力",
    code: "600900",
    level: StockLevel.CORE,
    allocation: 0.1,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 21.24,
      // type: ValuationType.PROFIT,
      // specialOffer: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0, 0, 0, 0],
      //   discount: 0.9,
      // },
      // conservative: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0, 0, 0, 0.02],
      //   discount: 0.9,
      // },
      // neutral: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0, 0, 0, 0.02, 0.04],
      //   discount: 0.9,
      // },
      // optimistic: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0, 0, 0, 0.02, 0.06],
      //   discount: 0.9,
      // },
      // backYearsNum: 10,
    },
  },
  {
    type: StockType.A,
    name: "国投电力",
    code: "600886",
    level: StockLevel.ROTATION,
    allocation: 0.1,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 11.78,
      // type: ValuationType.PROFIT,
      // specialOffer: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.1, -0.05, 0],
      //   discount: 0.9,
      // },
      // conservative: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.1, -0.05, 0.02],
      //   discount: 0.9,
      // },
      // neutral: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.1, -0.05, 0.04],
      //   discount: 0.9,
      // },
      // optimistic: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.1, -0.05, 0.06],
      //   discount: 0.9,
      // },
      // backYearsNum: 10,
    },
  },
  {
    type: StockType.A,
    name: "华能水电",
    code: "600025",
    level: StockLevel.MARGIN,
    allocation: 0.1,
    valuationConfig: {
      type: ValuationType.PROFIT,
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0],
        discount: 0.9,
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.03],
        discount: 0.9,
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.05],
        discount: 0.9,
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.7],
        discount: 0.9,
      },
      backYearsNum: 10,
    },
  },
  {
    type: StockType.A,
    name: "国电南瑞",
    code: "600406",
    level: StockLevel.MARGIN,
    allocation: 0.1,
    valuationConfig: {
      type: ValuationType.PROFIT,
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0],
        discount: 0.9,
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.05],
        discount: 0.9,
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.08],
        discount: 0.9,
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.1],
        discount: 0.9,
      },
      backYearsNum: 10,
    },
  },
];

export { electricityStockData };
