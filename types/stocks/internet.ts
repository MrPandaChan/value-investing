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
      price: 350,
    },
  },
];

export { internetStockData };
