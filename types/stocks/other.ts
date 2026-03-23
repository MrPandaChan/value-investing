import {
  ProfitValuationGrowthType,
  StockType,
  ValuationType,
  type StockItem,
} from "../index";

const otherStockData: StockItem[] = [
  {
    type: StockType.A,
    name: "科沃斯",
    code: "603486",
    allocation: 0,
    valuationConfig: {
      type: ValuationType.PROFIT,
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.25, -0.1, 0],
        discount: 0.9,
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.25, -0.1, 0.03],
        discount: 0.9,
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.25, -0.1, 0.05],
        discount: 0.9,
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.25, -0.1, 0.07],
        discount: 0.9,
      },
      backYearsNum: 10,
    },
  },
  {
    type: StockType.A,
    name: "中远海控",
    code: "601919",
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 12.49,
      // specialOffer: {
      //   type: ProfitValuationGrowthType.PROFIT,
      //   data: [100],
      // },
      // conservative: {
      //   type: ProfitValuationGrowthType.PROFIT,
      //   data: [150],
      // },
      // neutral: {
      //   type: ProfitValuationGrowthType.PROFIT,
      //   data: [200],
      // },
      // optimistic: {
      //   type: ProfitValuationGrowthType.PROFIT,
      //   data: [250],
      // },
      // backYearsNum: 7,
    },
  },
  {
    type: StockType.HK,
    name: "中远海控",
    code: "01919",
    allocation: 0.05,
    sharesPerLot: 500,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 9.84,
    },
  },
  {
    type: StockType.A,
    name: "盐湖股份",
    code: "000792",
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.PROFIT,
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.35, 0, 0],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.35, 0.08, 0.05],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.35, 0.1, 0.07],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.35, 0.12, 0.09],
      },
      backYearsNum: 10,
    },
  },
  {
    type: StockType.A,
    name: "爱玛科技",
    code: "603529",
    allocation: 0,
    valuationConfig: {
      type: ValuationType.PROFIT,
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.2, -0.1, 0],
        discount: 0.9,
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.2, -0.1, 0.03],
        discount: 0.9,
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.2, -0.1, 0.05],
        discount: 0.9,
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.2, -0.1, 0.07],
        discount: 0.9,
      },
      backYearsNum: 10,
    },
  },
  {
    type: StockType.A,
    name: "九号公司",
    code: "689009",
    allocation: 0,
    valuationConfig: {
      type: ValuationType.PROFIT,
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.15, -0.05, 0],
        discount: 0.9,
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.15, -0.05, 0.05],
        discount: 0.9,
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.15, -0.05, 0.08],
        discount: 0.9,
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.15, -0.05, 0.1],
        discount: 0.9,
      },
      backYearsNum: 10,
    },
  },
  {
    type: StockType.A,
    name: "顺丰控股",
    code: "002352",
    allocation: 0,
    valuationConfig: {
      type: ValuationType.PROFIT,
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.03],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.07],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.1],
      },
      backYearsNum: 10,
    },
  },
  {
    type: StockType.A,
    name: "永新股份",
    code: "002014",
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.PROFIT,
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0, 0.03],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0, 0.05],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0, 0.07],
      },
      backYearsNum: 10,
    },
  },
  {
    type: StockType.A,
    name: "安克创新",
    code: "300866",
    allocation: 0,
    valuationConfig: {
      type: ValuationType.PROFIT,
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.3, 0.1],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.3, 0.1],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.3, 0.2, 0.1],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.3, 0.2, 0.1],
      },
      backYearsNum: 10,
    },
  },
  {
    type: StockType.HK,
    name: "申洲国际",
    code: "02313",
    allocation: 0.05,
    sharesPerLot: 100,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 42,
    },
  },
  {
    type: StockType.HK,
    name: "安踏体育",
    code: "02020",
    allocation: 0.05,
    sharesPerLot: 200,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 54.9,
    },
  },
  {
    type: StockType.A,
    name: "北新建材",
    code: "000786",
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 19.68,
    },
  },
  {
    type: StockType.A,
    name: "福斯达",
    code: "603173",
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 31.59,
    },
  },
  {
    type: StockType.A,
    name: "周大生",
    code: "002867",
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 8.96,
    },
  },
  {
    type: StockType.A,
    name: "云天化",
    code: "600096",
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 27.53,
    },
  },
  {
    type: StockType.HK,
    name: "泡泡玛特",
    code: "09992",
    allocation: 0.05,
    sharesPerLot: 200,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 139.3,
    },
  },
  {
    type: StockType.A,
    name: "中谷物流",
    code: "603565",
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 7.6,
    },
  },
  {
    type: StockType.HK,
    name: "江南布衣",
    code: "03306",
    allocation: 0.03,
    sharesPerLot: 500,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 13.13,
    },
  },
  {
    type: StockType.A,
    name: "中国平安",
    code: "601318",
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 40.5,
    },
  },
  {
    type: StockType.HK,
    name: "中国平安",
    code: "02318",
    allocation: 0.05,
    sharesPerLot: 500,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 31.9,
    },
  },
  {
    type: StockType.A,
    name: "梅花生物",
    code: "600873",
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 7.87,
    },
  },
  {
    type: StockType.A,
    name: "公牛集团",
    code: "603195",
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 28.05,
    },
  },
  {
    type: StockType.A,
    name: "华特达因",
    code: "000915",
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 21.04,
    },
  },
  {
    type: StockType.A,
    name: "分众传媒",
    code: "002027",
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 3.76,
    },
  },
  {
    type: StockType.A,
    name: "海天味业",
    code: "603288",
    allocation: 0.05,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 17.69,
    },
  },
  {
    type: StockType.HK,
    name: "华润万象",
    code: "01209",
    allocation: 0.05,
    sharesPerLot: 200,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 17.05,
    },
  },
  {
    type: StockType.A,
    name: "中际旭创",
    code: "300308",
    allocation: 0.03,
    valuationConfig: {
      type: ValuationType.REFERENCE,
      price: 120.49,
    },
  },
];

export { otherStockData };
