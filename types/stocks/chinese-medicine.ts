import { StockLevel, StockType, ValuationType, type StockItem } from "../index";

const chineseMedicineStockData: StockItem[] = [
  {
    type: StockType.A,
    name: "云南白药",
    code: "000538",
    level: StockLevel.MARGIN,
    allocation: 0.1,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 31.61,
    },
  },
  {
    type: StockType.A,
    name: "东阿阿胶",
    code: "000423",
    level: StockLevel.MARGIN,
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 37.23,
      // type: ValuationType.PROFIT,
      // specialOffer: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.1, 0],
      //   discount: 0.9,
      // },
      // conservative: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.1, 0.05],
      //   discount: 0.9,
      // },
      // neutral: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.1, 0.07],
      //   discount: 0.9,
      // },
      // optimistic: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.1],
      //   discount: 0.9,
      // },
      // backYearsNum: 10,
    },
  },
  {
    type: StockType.A,
    name: "羚锐制药",
    code: "600285",
    level: StockLevel.MARGIN,
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 14.59,
      // type: ValuationType.PROFIT,
      // specialOffer: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.1, 0.02],
      //   discount: 0.9,
      // },
      // conservative: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.1, 0.06],
      //   discount: 0.9,
      // },
      // neutral: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.1, 0.09],
      //   discount: 0.9,
      // },
      // optimistic: {
      //   type: ProfitValuationGrowthType.RATE,
      //   data: [0.1, 0.12],
      //   discount: 0.9,
      // },
      // backYearsNum: 10,
    },
  },
];

export { chineseMedicineStockData };
