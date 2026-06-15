import { StockLevel, StockType, ValuationType, type StockItem } from "../index";

const nonferrousMetalsStockData: StockItem[] = [
  {
    type: StockType.A,
    name: "紫金矿业",
    code: "601899",
    allocation: 0.05,
    level: StockLevel.CORE,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 26.11,
    },
  },
  {
    type: StockType.HK,
    name: "紫金矿业",
    code: "02899",
    level: StockLevel.CORE,
    allocation: 0.05,
    sharesPerLot: 2000,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 22.33,
    },
  },
  {
    type: StockType.HK,
    name: "洛阳钼业",
    code: "03993",
    level: StockLevel.ROTATION,
    allocation: 0.03,
    sharesPerLot: 3000,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 8.6,
    },
  },
  {
    type: StockType.A,
    name: "藏格矿业",
    code: "000408",
    level: StockLevel.CORE,
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.DIVIDEND,
      dividendYield: 0.05,
    },
  },
];

export { nonferrousMetalsStockData };
