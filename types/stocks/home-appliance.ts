import {
  ProfitValuationGrowthType,
  StockType,
  ValuationType,
  type StockItem,
} from "../index";

const homeApplianceStockData: StockItem[] = [
  {
    type: StockType.A,
    name: "格力电器",
    code: "000651",
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 38.58,
      // type: ValuationType.PROFIT,
      // specialOffer: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.05, -0.08, -0.05, 0],
      // },
      // conservative: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.05, -0.05, 0],
      // },
      // neutral: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.05, -0.03, 0],
      // },
      // optimistic: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.05, 0, 0.05],
      // },
      // backYearsNum: 8,
    },
  },
  {
    type: StockType.A,
    name: "海尔智家",
    code: "600690",
    allocation: 0.1,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 21.95,
      // type: ValuationType.PROFIT,
      // specialOffer: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.1, 0],
      // },
      // conservative: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.1, 0.05],
      // },
      // neutral: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.1, 0.07],
      // },
      // optimistic: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.1, 0.09],
      // },
      // backYearsNum: 8.5,
    },
  },
  {
    type: StockType.HK,
    name: "海尔智家",
    code: "06690",
    allocation: 0.1,
    sharesPerLot: 200,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 18,
    },
  },
  {
    type: StockType.A,
    name: "美的集团",
    code: "000333",
    allocation: 0.1,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 65.14,
      // type: ValuationType.PROFIT,
      // specialOffer: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0],
      // },
      // conservative: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.05],
      // },
      // neutral: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.07],
      // },
      // optimistic: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.09],
      // },
      // backYearsNum: 9,
    },
  },
  {
    type: StockType.A,
    name: "老板电器",
    code: "002508",
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 15.88,
    },
  },
];

export { homeApplianceStockData };
