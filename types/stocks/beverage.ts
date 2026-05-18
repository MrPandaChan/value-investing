import { StockLevel, StockType, ValuationType, type StockItem } from "../index";

const beverageStockData: StockItem[] = [
  {
    type: StockType.A,
    name: "东鹏饮料",
    code: "605499",
    level: StockLevel.CORE,
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.DIRECT,
      price: 100,
    },
  },
];

export { beverageStockData };
