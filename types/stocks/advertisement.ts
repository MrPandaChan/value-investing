import { StockLevel, StockType, ValuationType, type StockItem } from "../index";

const advertisementStockData: StockItem[] = [
  {
    type: StockType.A,
    name: "分众传媒",
    code: "002027",
    level: StockLevel.ROTATION,
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.DIVIDEND,
      dividendYield: 0.07,
    },
  },
];

export { advertisementStockData };
