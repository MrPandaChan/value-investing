import { ProfitValuationGrowthType, type StockItem } from "../index";

const chineseMedicineStockData: StockItem[] = [
  {
    name: "云南白药",
    code: "000538",
    allocation: 0.1,
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.1, 0],
        discount: 0.9,
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.1, 0.05],
        discount: 0.9,
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.1, 0.07],
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
  {
    name: "东阿阿胶",
    code: "000423",
    allocation: 0.05,
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.1, 0],
        discount: 0.9,
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.1, 0.05],
        discount: 0.9,
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.1, 0.07],
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
  {
    name: "羚锐制药",
    code: "600285",
    allocation: 0.05,
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.1, 0.02],
        discount: 0.9,
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.1, 0.06],
        discount: 0.9,
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.1, 0.09],
        discount: 0.9,
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.1, 0.12],
        discount: 0.9,
      },
      backYearsNum: 10,
    },
  },
];

export { chineseMedicineStockData };
