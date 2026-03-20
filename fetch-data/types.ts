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

export interface DynamicData {
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

export type StockData = EastMoneyData & SinaFinanceData;

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
