import { StockLevel, StockType, ValuationType, type StockItem } from "../index";

const beverageStockData: StockItem[] = [
  {
    type: StockType.A,
    name: "东鹏饮料",
    code: "605499",
    level: StockLevel.ROTATION,
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.DIRECT,
      price: 100,
    },
  },
  {
    type: StockType.HK,
    name: "农夫山泉",
    code: "09633",
    sharesPerLot: 200,
    level: StockLevel.ROTATION,
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.DIRECT,
      price: 40,
    },
  },
];

export { beverageStockData };
