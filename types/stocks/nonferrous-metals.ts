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
    type: StockType.A,
    name: "洛阳钼业",
    code: "603993",
    level: StockLevel.MARGIN,
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.DIVIDEND,
      dividendYield: 0.05,
    },
  },
  {
    type: StockType.A,
    name: "藏格矿业",
    code: "000408",
    level: StockLevel.MARGIN,
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.DIVIDEND,
      dividendYield: 0.05,
    },
  },
  {
    type: StockType.A,
    name: "云铝股份",
    code: "000807",
    level: StockLevel.MARGIN,
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.DIVIDEND,
      dividendYield: 0.05,
    },
  },
  {
    type: StockType.A,
    name: "中国铝业",
    code: "601600",
    level: StockLevel.MARGIN,
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.DIVIDEND,
      dividendYield: 0.05,
    },
  },
  {
    type: StockType.A,
    name: "南山铝业",
    code: "600219",
    level: StockLevel.MARGIN,
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.DIVIDEND,
      dividendYield: 0.05,
    },
  },
  {
    type: StockType.A,
    name: "天山铝业",
    code: "002532",
    level: StockLevel.MARGIN,
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.DIVIDEND,
      dividendYield: 0.05,
    },
  },
  {
    type: StockType.A,
    name: "神火股份",
    code: "000933",
    level: StockLevel.MARGIN,
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.DIVIDEND,
      dividendYield: 0.05,
    },
  },
];

export { nonferrousMetalsStockData };
