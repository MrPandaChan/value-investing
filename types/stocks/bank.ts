import { StockLevel, StockType, ValuationType, type StockItem } from "../index";

const bankStockData: StockItem[] = [
  {
    type: StockType.A,
    name: "招商银行",
    code: "600036",
    level: StockLevel.CORE,
    allocation: 0.1,
    valuationConfig: {
      type: ValuationType.DIVIDEND,
      dividendYield: 0.07,
    },
  },
];

export { bankStockData };
