import {
  ProfitValuationGrowthType,
  StockLevel,
  StockType,
  ValuationType,
  type StockItem,
} from "../index";

const dairyStockData: StockItem[] = [
  {
    type: StockType.A,
    name: "伊利股份",
    code: "600887",
    level: StockLevel.MARGIN,
    allocation: 0.03,
    valuationConfig: {
      type: ValuationType.PROFIT,
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.2, 0.03, 0],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.2, 0.05, 0.03],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.2, 0.05, 0.05],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.2, 0.05, 0.07],
      },
      backYearsNum: 10,
    },
  },
];

export { dairyStockData };
