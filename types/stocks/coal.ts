import {
  ProfitValuationGrowthType,
  StockType,
  ValuationType,
  type StockItem,
} from "../index";

const coalStockData: StockItem[] = [
  {
    type: StockType.A,
    name: "中国神华",
    code: "601088",
    allocation: 0.1,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 25.48,
      // specialOffer: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.15, -0.1, 0],
      //   discount: 0.9,
      // },
      // conservative: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.15, -0.1, 0],
      //   discount: 0.9,
      // },
      // neutral: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.15, -0.1, 0.02],
      //   discount: 0.9,
      // },
      // optimistic: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.15, -0.1, 0.04],
      //   discount: 0.9,
      // },
      // backYearsNum: 10,
    },
  },
  {
    type: StockType.HK,
    name: "中国神华",
    code: "01088",
    allocation: 0.1,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 24.46,
    },
  },
  {
    type: StockType.A,
    name: "陕西煤业",
    code: "601225",
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 17.98,
      // type: ValuationType.PROFIT,
      // specialOffer: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.2, -0.1, 0],
      //   discount: 0.9,
      // },
      // conservative: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.2, -0.1, 0],
      //   discount: 0.9,
      // },
      // neutral: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.2, -0.1, 0.02],
      //   discount: 0.9,
      // },
      // optimistic: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.2, -0.1, 0.04],
      //   discount: 0.9,
      // },
      // backYearsNum: 10,
    },
  },
  {
    type: StockType.A,
    name: "中煤能源",
    code: "601898",
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 7.96,
      // type: ValuationType.PROFIT,
      // specialOffer: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.2, -0.1, 0],
      //   discount: 0.9,
      // },
      // conservative: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.2, -0.1, 0],
      //   discount: 0.9,
      // },
      // neutral: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.2, -0.1, 0.02],
      //   discount: 0.9,
      // },
      // optimistic: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.2, -0.1, 0.04],
      //   discount: 0.9,
      // },
      // backYearsNum: 10,
    },
  },
  {
    type: StockType.HK,
    name: "中煤能源",
    code: "01898",
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 7.04,
    },
  },
  {
    type: StockType.A,
    name: "兖矿能源",
    code: "600188",
    allocation: 0.02,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 10.34,
      // type: ValuationType.PROFIT,
      // specialOffer: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.25, -0.1, 0],
      //   discount: 0.9,
      // },
      // conservative: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.25, -0.1, 0],
      //   discount: 0.9,
      // },
      // neutral: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.25, -0.1, 0.02],
      //   discount: 0.9,
      // },
      // optimistic: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.25, -0.1, 0.04],
      //   discount: 0.9,
      // },
      // backYearsNum: 10,
    },
  },
  {
    type: StockType.HK,
    name: "兖矿能源",
    code: "01171",
    allocation: 0.02,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 7.93,
    },
  },
];

export { coalStockData };
