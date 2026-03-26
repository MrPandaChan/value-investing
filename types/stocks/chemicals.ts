import {
  ProfitValuationGrowthType,
  StockLevel,
  StockType,
  ValuationType,
  type StockItem,
} from "../index";

const chemicalsStockData: StockItem[] = [
  {
    type: StockType.A,
    name: "万华化学",
    code: "600309",
    level: StockLevel.MARGIN,
    allocation: 0,
    valuationConfig: {
      type: ValuationType.PROFIT,
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.3, -0.1, 0],
        discount: 0.9,
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.3, -0.1, 0.03],
        discount: 0.9,
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.3, -0.1, 0.05],
        discount: 0.9,
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.3, -0.1, 0.07],
        discount: 0.9,
      },
      backYearsNum: 10,
    },
  },
];

export { chemicalsStockData };
