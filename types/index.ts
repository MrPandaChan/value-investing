import type { DynamicData } from "../fetch-data/types";

// 基础工具类型
type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

// 核心 Assign 类型实现
export type Assign<T extends any[], Result = {}> = T extends [
  infer First,
  ...infer Rest
]
  ? First extends object
    ? Assign<Rest, Prettify<Omit<Result, keyof First> & First>>
    : Assign<Rest, Result> // 忽略非对象类型
  : Prettify<Result>;

export enum ProfitValuationGrowthType {
  PROFIT,
  RATE,
}

export interface ProfitValuationGrowth {
  type: ProfitValuationGrowthType;
  data: number[];
  discount?: number;
}

export interface ProfitValuationConfig {
  specialOffer?: ProfitValuationGrowth;
  conservative?: ProfitValuationGrowth;
  neutral?: ProfitValuationGrowth;
  optimistic?: ProfitValuationGrowth;
  backYearsNum: number;
}

// 港股部分设置
export interface HKMarketConfig {
  code: string;
  dividendTaxRate: number; // 股息税率
  discount?: number; // 估值打折
}

// B股部分设置
export type BMarketConfig = Omit<HKMarketConfig, "dividendTaxRate">;

export interface StockItem {
  code: string;
  name: string;
  profitValuationConfig?: ProfitValuationConfig;
  hkMarketConfig?: HKMarketConfig;
  bMarketConfig?: BMarketConfig;
}

const chineseSpiritsStockData: StockItem[] = [
  {
    name: "贵州茅台",
    code: "600519",
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.06, 0],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.06, 0.03],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.06, 0.03, 0.06],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.06, 0.09],
      },
      backYearsNum: 10,
    },
  },
  {
    name: "五粮液",
    code: "000858",
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.15, -0.1, 0],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.15, -0.1, 0.02],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.15, -0.1, 0.05],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.15, -0.05, 0.07],
      },
      backYearsNum: 8,
    },
  },
  {
    name: "泸州老窖",
    code: "000568",
  },
  {
    name: "古井贡酒",
    code: "000596",
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.2, -0.1, 0],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.2, -0.1, 0.05],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.2, -0.1, 0.05],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.2, -0.1, 0.07],
      },
      backYearsNum: 8,
    },
    bMarketConfig: {
      code: "200596",
    },
  },
  {
    name: "山西汾酒",
    code: "600809",
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0, 0],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0, 0.05],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0, 0.09],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0, 0.12],
      },
      backYearsNum: 8,
    },
  },
];

const homeApplianceStockData: StockItem[] = [
  {
    name: "格力电器",
    code: "000651",
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.05, -0.08, -0.05, 0],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.05, -0.05, 0],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.05, -0.03, 0],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.05, 0, 0.05],
      },
      backYearsNum: 8,
    },
  },
  {
    name: "海尔智家",
    code: "600690",
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.1, 0],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.1, 0.05],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.1, 0.07],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.1, 0.09],
      },
      backYearsNum: 8.5,
    },
  },
  {
    name: "美的集团",
    code: "000333",
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.05],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.07],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.09],
      },
      backYearsNum: 9,
    },
  },
];

export const carStockData: StockItem[] = [
  {
    name: "比亚迪",
    code: "002594",
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.12, 0.05],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.12, 0.1],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.12, 0.12],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [-0.12, 0.15],
      },
      backYearsNum: 10,
    },
  },
  {
    name: "宇通客车",
    code: "600066",
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.35, 0.05],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.35, 0.1],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.35, 0.12],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.35, 0.15],
      },
      backYearsNum: 10,
    },
  },
  {
    name: "福耀玻璃",
    code: "600660",
    profitValuationConfig: {
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.3, 0.1],
      },
      backYearsNum: 10,
    },
    hkMarketConfig: {
      code: "03606",
      dividendTaxRate: 0.8,
    },
  },
];

const electricityStockData: StockItem[] = [
  {
    name: "长江电力",
    code: "600900",
  },
  {
    name: "国投电力",
    code: "600886",
  },
];

const coalStockData: StockItem[] = [
  {
    name: "中国神华",
    code: "601088",
  },
  {
    name: "陕西煤业",
    code: "601225",
  },
  {
    name: "中煤能源",
    code: "601898",
  },
  {
    name: "兖矿能源",
    code: "600188",
  },
];

const operatorStockData: StockItem[] = [
  {
    name: "中国移动",
    code: "600941",
    profitValuationConfig: {
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.04, 0.02],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.05],
      },
      backYearsNum: 10,
    },
    hkMarketConfig: {
      code: "00941",
      dividendTaxRate: 0.72,
    },
  },
  {
    name: "中国电信",
    code: "601728",
  },
  {
    name: "中国联通",
    code: "600050",
  },
];

const oilStockData: StockItem[] = [
  {
    name: "中国海油",
    code: "600938",
    profitValuationConfig: {
      neutral: {
        type: ProfitValuationGrowthType.PROFIT,
        data: [1200],
      },
      backYearsNum: 8,
    },
    hkMarketConfig: {
      code: "00883",
      dividendTaxRate: 0.72,
    },
  },
  {
    name: "中国石油",
    code: "601857",
    profitValuationConfig: {
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0],
      },
      backYearsNum: 8,
    },
  },
  {
    name: "中国石化",
    code: "600028",
    profitValuationConfig: {
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0],
      },
      backYearsNum: 8,
    },
  },
];

export const stockData: StockItem[] = [
  ...chineseSpiritsStockData,
  ...homeApplianceStockData,
  ...carStockData,
  ...electricityStockData,
  ...coalStockData,
  ...operatorStockData,
  ...oilStockData,
  {
    name: "科沃斯",
    code: "603486",
  },
  {
    name: "中远海控",
    code: "601919",
    profitValuationConfig: {
      conservative: {
        type: ProfitValuationGrowthType.PROFIT,
        data: [150],
      },
      backYearsNum: 7,
    },
  },
  {
    name: "盐湖股份",
    code: "000792",
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.35, 0.03],
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.35, 0.08],
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.35, 0.1],
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.35, 0.12],
      },
      backYearsNum: 10,
    },
  },
  {
    name: "爱玛科技",
    code: "603529",
  },
  {
    name: "九号公司",
    code: "689009",
  },
  {
    name: "青岛港",
    code: "601298",
    profitValuationConfig: {
      specialOffer: {
        type: ProfitValuationGrowthType.RATE,
        data: [0],
        discount: 0.9,
      },
      conservative: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.03],
        discount: 0.9,
      },
      neutral: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.05],
        discount: 0.9,
      },
      optimistic: {
        type: ProfitValuationGrowthType.RATE,
        data: [0.08],
        discount: 0.9,
      },
      backYearsNum: 10,
    },
    hkMarketConfig: {
      code: "06198",
      dividendTaxRate: 0.8,
    },
  },
  {
    name: "顺丰控股",
    code: "002352",
    profitValuationConfig: {
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
    name: "永新股份",
    code: "002014",
    profitValuationConfig: {
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
];

(function validate() {
  const map: Record<string, number> = {};
  for (const item of stockData) {
    const val = map[item.code];
    if (typeof val === "number") {
      map[item.code] = val + 1;
      console.warn(`存在重复的 code：${item.code}_${item.name}`);
    } else {
      map[item.code] = 1;
    }
  }
})();

export const getStockItem = (code: string) => {
  const item = stockData.find((v) => v.code === code);
  if (!item) {
    console.log(`cannot find ${code}.`);
  }

  return item!;
};

export interface BasicRevenueData {
  year: string;
  revenue: number; // 营业收入
  netProfit: number; // 归母净利润
  netProfitMargin: number; // 净利润率
  netProfitExcludingNon: number; // 扣非净利润
  coreProfit: number; // 核心利润
  cashFlowFromOperating: number; // 经营净现金流
  fcf: number; // 自由现金流
  capex: number; // CAPEX
  fcfOverNetProfit: number; // 自由现金流/归母净利润
  netProfitExcludingNonOvernetProfit: number; // 扣非净利润/归母净利润
  cashFlowFromOperatingOverNetProfit: number; // 经营现金流/归母净利润
  operatingProfit: number; // 经营利润
  financialProfit: number; // 金融利润
  operatingProfitOverNetProfit: number; // 经营利润/归母净利润
}

export interface CostsExpensesData {
  year: string;
  grossProfitMargin: number; // 毛利率
  netProfitMargin: number; // 净利率
  grossProfitMinusNetProfit: number; // 毛利率-净利润率
  devExpenses: number; // 研发费用
  manageExpenses: number; // 管理费用
  devAndManageExpenses: number; // 管理研发费用
  sellingExpenses: number; // 销售费用
  financialExpenses: number; // 财务费用
  totalOperatingExpenses: number; // 期间费用合计
  sellingExpensesRatio: number; // 销售费用率
  devExpensesRatio: number; // 研发费用率
  manageExpensesRatio: number; // 管理费用率
  devAndManageExpensesRatio: number; // 管理研发费用率
  totalOperatingExpensesRatio: number; // 期间费用率
}

export interface BalanceData {
  year: string;
  currentAssets: number; // 流动资产
  cash: number; // 现金
  inventory: number; // 存货
  nonCurrentAssets: number; // 非流动资产
  totalAssets: number; // 总资产
  equity: number; // 归母净资产
  interestFreeLiabilities: number; // 无息负债（应付+预收+合同）
  interestBearingDebt: number; // 有息负债
  interestExpense: number; // 利息费用
  interestFreeLiabilitiesOverTotal: number; // 无息/总资产
  interestBearingDebtOverTotal: number; // 有息/总资产
  debtRatio: number; // 资产负债率
}

export interface WorkingCapitalData {
  year: string;
  wcPerYuanRevenue: number; // 1元收入需要的WC
  wc: number; // WC
  receivables: number; // 应收
  prepayments: number; // 预付款项
  inventory: number; // 存货
  accountsPayable: number; // 应付账款
  customerAdvances: number; // 预收
  contractLiabilities: number; // 合同负债
  receivablesToRevenueRatio: number; // 应收占收入比重
  prepaymentsToRevenueRatio: number; // 预付占收入比重
  inventoryToRevenueRatio: number; // 存货占收入比重
  accountsPayableToRevenueRatio: number; // 应付占收入比重
  advancesToRevenueRatio: number; // 预收占收入比重
  contractLiabilitiesToRevenueRatio: number; // 合同负债占收入比重
  changeInWC: number; // 新增WC
}

export interface FixedAssetInvestmentAnalysisData {
  year: string;
  fixedAssetsPerYuanRevenue: number; // 1 元收入需要的固定资产
  longTermOperatingAssetsPerYuanRevenue: number; // 1 元收入需要的长期资产
  fixedAssets: number; // 固定资产
  longTermOperatingAssets: number; // 长期经营资产
  depreciation: number; // 折旧
  depreciationOverRevenue: number; // 折旧/收入
  // 机器设备原值
  // 1 元收入机器设备
}

export interface ReturnData {
  year: string;
  roe: number; // ROE
  roa: number; // ROA
  roic: number; // ROIC
  netProfitMargin: number; // 销售净利率
  assetTurnover: number; // 资产周转率
  equityMultiplier: number; // 权益乘数
}

export interface TurnoverRateData {
  year: string;
  totalAssets: number; // 总资产
  avgTotalAssets: number; // 平均总资产
  avgCurrentAssets: number; // 平均流动资产
  avgInventory: number; // 平均存货
  equity: number; // 归母净资产
  avgEquity: number; // 平均归母净资产
  totalAssetsDays: number; // 总资产周转天数
  currentAssetsDays: number; // 流动资产周转天数
  wcDays: number; // WC 周转天数
  receivablesDays: number; // 应收周转天数
  inventoryDays: number; // 存货周转天数
  fixedAssetsDays: number; // 固定资产周转天数
}

export interface PrimaryBusinessData {
  year: string; // 年份
  mainType: string; // 行业、产品、地区
  itemName: string; // 类型
  mainBusinessIncome: number; // 主营收入
  mbiRatio: number; // 收入比例
  mainBusinessCost: number; // 主营成本
  mbcRatio: number; // 成本比例
  mainBusinessProfit: number; // 主营利润
  mbpRatio: number; // 利润比例
  grossProfitRatio: number; // 毛利率
}

export interface ValuationHistoryData {
  year: string;
  profit: number;
  profit_tb: number;
  basicEps: number;
  totalSharesOutstanding: number;
  dps: number; // 每股分红 Dividend Per Share
  dividendRatio: number; // 分红率
  totalDividend: number;
  totalDividendA: number;
}

export interface ValuationData {
  historyData: ValuationHistoryData[];
  cash: number; // 货币资金
  interestBearingDebt: number; // 有息负债
  interestBearingDebtOverTotal: number; // 有息/总资产
  debtRatio: number; // 资产负债率
  roe: number; // ROE
  roic: number; // ROIC
  roa: number; // ROA
  grossProfitMargin: number; // 毛利率
  netProfitMargin: number; // 净利率
  tradingFinancialAssets: number; // 交易性金融资产
  longTermEquityInvestment: number; // 长期股权投资
  minorityInterest: number; // 少数股东权益
}

export interface RecentYearData {
  netProfit: number; // 最新归母净利润
}

export interface ServiceData {
  [code: string | number]: {
    basicRevenueData: BasicRevenueData[];
    costsExpensesData: CostsExpensesData[];
    balanceData: BalanceData[];
    workingCapitalData: WorkingCapitalData[];
    fixedAssetInvestmentAnalysisData: FixedAssetInvestmentAnalysisData[];
    returnData: ReturnData[];
    turnoverRateData: TurnoverRateData[];
    primaryBusinessData: PrimaryBusinessData[];
    valuationData: ValuationData;
    dynamicData: DynamicData;
    recentYearData: RecentYearData;
  };
}
