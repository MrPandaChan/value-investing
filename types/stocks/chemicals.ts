import { ProfitValuationGrowthType, type StockItem } from "../index";

const chemicalsStockData: StockItem[] = [
  {
    name: "万华化学",
    code: "600309",
    allocation: 0,
    profitValuationConfig: {
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0],
      },
      backYearsNum: 10,
    },
  },
];

export { chemicalsStockData };
