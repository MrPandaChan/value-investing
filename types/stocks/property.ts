import {
  ProfitValuationGrowthType,
  StockLevel,
  StockType,
  ValuationType,
  type StockItem,
} from "../index";

const propertyStockData: StockItem[] = [
  {
    type: StockType.HK,
    name: "保利物业",
    code: "06049",
    level: StockLevel.MARGIN,
    allocation: 0.05,
    sharesPerLot: 200,
    valuationConfig: {
      type: ValuationType.PROFIT,
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0],
        discount: 0.8,
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.03],
        discount: 0.8,
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.05],
        discount: 0.8,
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.08],
        discount: 0.8,
      },
      backYearsNum: 10,
    },
  },
];

export { propertyStockData };
