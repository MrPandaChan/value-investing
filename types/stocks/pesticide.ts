import {
  ProfitValuationGrowthType,
  StockLevel,
  StockType,
  ValuationType,
  type StockItem,
} from "../index";

const pesticideStockData: StockItem[] = [
  {
    type: StockType.A,
    name: "广信股份",
    code: "603599",
    level: StockLevel.MARGIN,
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 10.22,
      // type: ValuationType.PROFIT,
      // specialOffer: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.3, -0.1, 0],
      //   discount: 0.9,
      // },
      // conservative: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.3, -0.1, 0.03],
      //   discount: 0.9,
      // },
      // neutral: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.3, -0.1, 0.05],
      //   discount: 0.9,
      // },
      // optimistic: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [-0.3, -0.1, 0.07],
      //   discount: 0.9,
      // },
      // backYearsNum: 10,
    },
  },
];

export { pesticideStockData };
