import { ProfitValuationGrowthType, type StockItem } from "../index";

const dairyStockData: StockItem[] = [
  {
    name: "伊利股份",
    code: "600887",
    allocation: 0.05,
    profitValuationConfig: {
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.2, 0.05],
      },
      backYearsNum: 10,
    },
  },
];

export { dairyStockData };
