import { StockType, ValuationType, type StockItem } from "../index";

const bankStockData: StockItem[] = [
  {
    type: StockType.HK,
    name: "H腾讯控股",
    code: "00700",
    allocation: 0.2,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 350,
    },
  },
];

export { bankStockData };
