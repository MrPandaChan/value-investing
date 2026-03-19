import { privateDecrypt } from "crypto";
import { ValuationType, type StockItem } from "../index";

const bankStockData: StockItem[] = [
  {
    name: "招商银行",
    code: "600036",
    allocation: 0.1,
    valuationConfig: {
      type: ValuationType.DIVIDEND,
      dividendYield: 0.05,
    },
  },
];

export { bankStockData };
