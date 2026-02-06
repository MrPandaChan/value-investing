import { ProfitValuationGrowthType, type StockItem } from "../index";

const chemicalsStockData: StockItem[] = [
  {
    name: "万华化学",
    code: "600309",
    allocation: 0,
    profitValuationConfig: {
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
