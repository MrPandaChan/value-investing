export interface SinaResponseDataReportDate {
  date_value: string;
  date_description: string;
  date_type: 1 | 2 | 3 | 4;
}

export interface SinaResponseData {
  report_count: number;
  report_date: SinaResponseDataReportDate[];
  report_list: {
    [date_value: string]: {
      rType: string;
      rCurrency: string;
      data_source: string;
      is_aduit: string;
      publish_date: string;
      update_time: number;
      is_exist_yoy: boolean;
      data: ReportDateItem[];
    };
  };
}

export interface ReportDateItem {
  item_field: string;
  item_title: string;
  item_value: string | null;
  item_display_type: number;
  item_display: string;
  item_precision: string;
  item_group_no: number;
  item_source: string;
  item_tongbi: number;
}

export interface SinaResponse {
  result: {
    status: {
      msg?: string; // 'Input error'
      code: 0;
    };
    data: SinaResponseData;
  };
}

export interface PrimaryBusinessResponseData {
  SECUCODE: string; // 000858.SZ
  SECURITY_CODE: string; // 000858
  REPORT_DATE: string; // '2022-12-31 00:00:00'
  MAINOP_TYPE: "1" | "2" | "3"; // 按行业、按产品、按地区
  ITEM_NAME: string; // 酒类
  MAIN_BUSINESS_INCOME: number; // 主营收入 67562646631.24
  MBI_RATIO: number; // 收入比例 0.913396
  MAIN_BUSINESS_COST?: number; // 主营成本 12242850024.31
  MBC_RATIO?: number; // 成本比例 0.673482
  MAIN_BUSINESS_RPOFIT?: number; // 主营利润 55319796606.93
  MBR_RATIO?: number; // 利润比例 0.991568
  GROSS_RPOFIT_RATIO?: number; // 毛利率; 0.818793
  RANK: number; // 排序 1
}

export interface EastMoneyCashFlowResponse {
  REPORT_DATE: string; // "2025-03-31 00:00:00"
  FA_IR_DEPR: number; // 补充资料-固定资产和投资性房地产折旧
  FA_IR_DEPR_YOY: number;
  USERIGHT_ASSET_AMORTIZE: number; // 使用权资产折旧
  USERIGHT_ASSET_AMORTIZE_YOY: number;
  IA_AMORTIZE: number; // 补充资料-无形资产摊销
  IA_AMORTIZE_YOY: number;
  LPE_AMORTIZE: number; // 补充资料-长期待摊费用摊销
  LPE_AMORTIZE_YOY: number;
}

export interface EastMoneyDividendResponse {
  ASSIGN_OBJECT: string; // 分配对象 全体股东
  ASSIGN_PROGRESS: string; // 方案进度 实施方案
  EQUITY_RECORD_DATE: string; // 股权登记日 "2020-07-15 00:00:00"
  EX_DIVIDEND_DATE: string; // 除权除息日 "2020-07-16 00:00:00"
  IMPL_PLAN_NEWPROFILE: string; // '10派2.031195元(实施方案)'
  IMPL_PLAN_PROFILE: string; // 分红方案 '10派2.031195元'
  IS_UNASSIGN: "0" | "1"; // '0' 已分配或转增，'1' 表示不分配不转增
  NOTICE_DATE: string; // 公告日期 '2020-07-09 00:00:00'
  PAY_CASH_DATE: string; // 派息日 '2020-07-16 00:00:00'
  REPORT_DATE: string; // 报告期 '2019年报'
  SECUCODE: string; // '000423.SZ'
  SECURITY_CODE: string; // '000423'
  SECURITY_NAME_ABBR: string; // '东阿阿胶'
  TOTAL_DIVIDEND: number; // 分红总额
  TOTAL_DIVIDEND_A: number; // 分红总额（A股）
}

export interface EastMoneyHKDividendResponse {
  DIVIDEND_DATE: string; // 发放日 '2025/07/11'
  EX_DIVIDEND_DATE: string; // 除净日 '2025/06/12'
  IS_BFP: string; // '0'
  PLAN_EXPLAIN: string; // 分红方案 '每股派港币0.66元'
  REPORT_TYPE: string; // 分类类型 '年度分配' '中期分配' '特别分配'
  SECURITY_CODE: string; // '00883'
  TRANSFER_END_DATE: string; // 截止过户日 '2025/06/16-2025/06/20'
  UPDATE_DATE: string; // 最新公告日 '2025-06-05 00:00:00'
  YEAR: string; // 财政年度 '2024'
}

export interface DynamicData {
  name: string;
  change: number;
  prevClose: number;
  code: string;
  price: number;
  marketValue: number;
  PB: number;
  PE_TTM: number;
  totalSharesOutstanding: number;
}

export interface EastMoneyData {
  primaryBusiness: PrimaryBusinessResponseData[];
  eastMoneyCashFlow: EastMoneyCashFlowResponse[];
  dynamicData: DynamicData;
  dividendData: EastMoneyDividendResponse[];
}

export interface SinaFinanceData {
  gjzb: SinaResponseData;
  fzb: SinaResponseData;
  lrb: SinaResponseData;
  llb: SinaResponseData;
}

// ===================== 港股数据类型 =====================

/**
 * 港股 gjzb（关键指标）中每条数据
 */
export interface HKGjzbItem {
  REPORT_DATE: string; // "2026-03-31 00:00:00"
  DATE_TYPE_CODE: string; // "001"=年报, "002"=中报, "003"=季报
  OPERATE_INCOME: number | null; // 营业收入
  OPERATE_INCOME_YOY: number | null;
  GROSS_PROFIT: number | null; // 毛利
  GROSS_PROFIT_YOY: number | null;
  HOLDER_PROFIT: number | null; // 归母净利润
  HOLDER_PROFIT_YOY: number | null;
  NETCASH_OPERATE: number | null; // 经营活动现金流量净额
  PER_NETCASH_OPERATE: number | null; // 每股经营现金流
  OPERATE_PROFIT: number | null; // 营业利润
  PRETAX_PROFIT: number | null; // 税前利润
  BASIC_EPS: number | null; // 基本每股收益
  DILUTED_EPS: number | null; // 稀释每股收益
  BPS: number | null; // 每股净资产
  TOTAL_ASSETS: number | null; // 总资产
  TOTAL_LIABILITIES: number | null; // 总负债
  TOTAL_PARENT_EQUITY: number | null; // 归母权益
  DEBT_ASSET_RATIO: number | null; // 资产负债率
  CURRENT_RATIO: number | null; // 流动比率
  GROSS_PROFIT_RATIO: number | null; // 毛利率
  NET_PROFIT_RATIO: number | null; // 净利率
  ROE_AVG: number | null; // 加权ROE（当期）
  ROE_YEARLY: number | null; // ROE（全年）
  ROA: number | null; // ROA
  ROIC_YEARLY: number | null; // ROIC
  EQUITY_MULTIPLIER: number | null; // 权益乘数
  EQUITY_RATIO: number | null; // 权益比率
  TAX_EBT: number | null; // 实际税率
  OCF_SALES: number | null; // 经营现金流/营业收入
  END_CASH: number | null; // 期末现金
  NETCASH_INVEST: number | null;
  NETCASH_FINANCE: number | null;
  ISSUED_COMMON_SHARES: number | null; // 总股本
  HK_COMMON_SHARES: number | null; // 港股股本
  PER_SHARES: number | null; // 面值
  TOTAL_MARKET_CAP: number | null;
  PE_TTM: number | null;
  PB_TTM: number | null;
  DIVI_RATIO: number | null; // 分红率
  DPS_HKD: number | null; // 每股分红(HKD)
  DPS_HKD_LY: number | null;
  DIVIDEND_RATE: number | null; // 股息率
  ACCOUNTS_RECE_TDAYS: number | null; // 应收账款周转天数
  INVENTORY_TDAYS: number | null; // 存货周转天数
  CURRENT_ASSETS_TDAYS: number | null; // 流动资产周转天数
  TOTAL_ASSETS_TDAYS: number | null; // 总资产周转天数
  COMMON_ACS: number | null;
  CURRENTDEBT_DEBT: number | null;
  CURRENCY: string; // 货币 "HKD"
  IS_CNY_CODE: number;
  ORG_TYPE: string;
  [key: string]: any; // 允许其他字段
}

/**
 * 港股 fzb/lrb/llb 中的每条明细数据
 */
export interface HKDetailItem {
  REPORT_DATE: string; // "2026-03-31 00:00:00"
  DATE_TYPE_CODE: string; // "001"/"002"/"003"
  STD_ITEM_CODE: string; // 标准科目代码
  STD_ITEM_NAME: string; // 标准科目中文名称
  AMOUNT: number | null; // 金额
  FISCAL_YEAR?: string; // 财务年度 "12-31"
  START_DATE?: string; // 起始日期 "2026-01-01 00:00:00"
  SECUCODE?: string;
  SECURITY_CODE?: string;
  SECURITY_NAME_ABBR?: string;
  ORG_CODE?: string;
  STD_REPORT_DATE?: string;
  [key: string]: any;
}

/**
 * 港股分红数据
 */
export interface EastMoneyHKDividendResponse {
  DIVIDEND_DATE: string; // 发放日 '2025/07/11'
  EX_DIVIDEND_DATE: string; // 除净日 '2025/06/12'
  IS_BFP: string; // '0'
  PLAN_EXPLAIN: string; // 分红方案 '每股派港币0.66元'
  REPORT_TYPE: string; // 分类类型 '年度分配' '中期分配' '特别分配'
  SECURITY_CODE: string; // '00883'
  TRANSFER_END_DATE: string; // 截止过户日
  UPDATE_DATE: string; // 最新公告日
  YEAR: string; // 财政年度 '2024'
}

/**
 * 港股数据结构（原始数据）
 */
export interface HKStockDataType {
  gjzb: HKGjzbItem[];
  fzb: HKDetailItem[];
  lrb: HKDetailItem[];
  llb: HKDetailItem[];
  primaryBusiness: null;
  eastMoneyCashFlow: HKDetailItem[] | any[];
  dividendData: EastMoneyHKDividendResponse[] | null;
  dynamicData: DynamicData;
}

export type StockData = (EastMoneyData & SinaFinanceData) | HKStockDataType;

export interface EastMoneyResponseWrap<T> {
  code: 0;
  message: "ok";
  result: {
    count: number;
    data: T[];
    pages: number;
  };
  success: boolean;
  version: string;
}
