import {
  ProfitValuationGrowthType,
  StockLevel,
  StockType,
  ValuationType,
  type StockItem,
} from "../index";

const medicalStockData: StockItem[] = [
  {
    type: StockType.A,
    name: "百济神州",
    code: "688235",
    level: StockLevel.MARGIN,
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.DIVIDEND,
      dividendYield: 0.01,
    },
  },
  {
    type: StockType.A,
    name: "恒瑞医药",
    code: "600276",
    level: StockLevel.MARGIN,
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.DIVIDEND,
      dividendYield: 0.01,
    },
  },
  {
    type: StockType.A,
    name: "迈瑞医疗",
    code: "300760",
    level: StockLevel.MARGIN,
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.DIVIDEND,
      dividendYield: 0.01,
    },
  },
  {
    type: StockType.A,
    name: "爱尔眼科",
    code: "300015",
    level: StockLevel.MARGIN,
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.DIVIDEND,
      dividendYield: 0.01,
    },
  },
  {
    type: StockType.A,
    name: "通策医疗",
    code: "600763",
    level: StockLevel.MARGIN,
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.DIVIDEND,
      dividendYield: 0.01,
    },
  },
  {
    type: StockType.A,
    name: "药明康德",
    code: "603259",
    level: StockLevel.MARGIN,
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.DIVIDEND,
      dividendYield: 0.01,
    },
  },
];

export { medicalStockData };
