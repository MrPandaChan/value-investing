import { StockLevel, StockType, ValuationType, type StockItem } from "../index";

const houseHoldGoodsStockData: StockItem[] = [
  {
    type: StockType.A,
    name: "公牛集团",
    code: "603195",
    level: StockLevel.ROTATION,
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.DIVIDEND,
      dividendYield: 0.05,
    },
  },
];

export { houseHoldGoodsStockData };
