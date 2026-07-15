import { StockLevel, StockType, ValuationType, type StockItem } from "../index";

const internetStockData: StockItem[] = [
  {
    type: StockType.HK,
    name: "腾讯控股",
    code: "00700",
    level: StockLevel.CORE,
    allocation: 0.2,
    sharesPerLot: 100,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 392,
    },
  },
  {
    type: StockType.HK,
    name: "心动公司",
    code: "02400",
    level: StockLevel.CORE,
    allocation: 0.05,
    sharesPerLot: 200,
    valuationConfig: {
      type: ValuationType.DIVIDEND,
      dividendYield: 0.01,
    },
  },
];

export { internetStockData };
