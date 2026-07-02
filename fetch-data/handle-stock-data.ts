import formatDate, { amortize, getPayVal } from "./helper";
import { loadAllStockData } from "./load-all-data";
import { saveDataToTsFileAsync } from "./save-data";
import type {
  EastMoneyHKDividendResponse,
  HKDetailItem,
  HKGjzbItem,
  HKStockDataType,
  ReportDateItem,
  SinaFinanceData,
  SinaResponseDataReportDate,
  StockData,
} from "./types";
import type {
  BalanceData,
  BasicRevenueData,
  CostsExpensesData,
  FixedAssetInvestmentAnalysisData,
  PrimaryBusinessData,
  RecentYearData,
  ReturnData,
  ServiceData,
  TurnoverRateData,
  ValuationData,
  ValuationHistoryData,
  WorkingCapitalData,
} from "../types/index";

// ===================== 港股数据兼容工具 =====================

/**
 * 判断数据是否为港股格式（gjzb 为数组则为港股）
 */
function isHKStockData(data: StockData): data is HKStockDataType {
  return Array.isArray((data as any).gjzb);
}

/**
 * 港股 DATE_TYPE_CODE → A-share date_type 映射
 */
function mapHKDateType(dateTypeCode: string, dateValue: string): 1 | 2 | 3 | 4 {
  if (dateTypeCode === "001") return 4; // 年报
  if (dateTypeCode === "002") return 2; // 中报
  // 季报根据日期月份判断
  const month = parseInt(dateValue.substring(5, 7), 10);
  if (month === 3) return 1;
  if (month === 9) return 3;
  return 1; // 默认Q1
}

/**
 * 从港股数据中获取按日期排序的 report_date 数组
 */
function getReportDates(data: StockData): SinaResponseDataReportDate[] {
  if (isHKStockData(data)) {
    const dateSet = new Set<string>();
    const dates: SinaResponseDataReportDate[] = [];
    for (const item of data.gjzb) {
      const dv = item.REPORT_DATE.replace(/\s.*$/, ""); // "2026-03-31"
      if (!dateSet.has(dv)) {
        dateSet.add(dv);
        dates.push({
          date_value: dv,
          date_description: "",
          date_type: mapHKDateType(item.DATE_TYPE_CODE, dv),
        });
      }
    }
    dates.sort((a, b) => b.date_value.localeCompare(a.date_value));
    return dates;
  }
  return data.gjzb.report_date;
}

/**
 * 格式化日期为显示年份（兼容港股）
 */
function formatYear(date: SinaResponseDataReportDate) {
  const year = date.date_value.substring(0, 4);
  return date.date_type < 4 ? `${year}Q${date.date_type}` : year;
}

/**
 * 港股关键指标 gjzb 字段映射表（A-share item_field → HK gjzb 字段名）
 */
const HK_GJZB_FIELD_MAP: Record<string, keyof HKGjzbItem> = {
  BIZINCO: "OPERATE_INCOME",
  PARENETP: "HOLDER_PROFIT",
  MANANETR: "NETCASH_OPERATE",
  SGPMARGIN: "GROSS_PROFIT_RATIO",
  SNPMARGINCONMS: "NET_PROFIT_RATIO",
  ROEWEIGHTED: "ROE_YEARLY",
  ROA: "ROA",
  ROIC: "ROIC_YEARLY",
  EMCONMS: "EQUITY_MULTIPLIER",
  TATURNDAYS: "TOTAL_ASSETS_TDAYS",
  CURASSTURNDAYS: "CURRENT_ASSETS_TDAYS",
  ACCRECGTURNDAYS: "ACCOUNTS_RECE_TDAYS",
  INVTURNDAYS: "INVENTORY_TDAYS",
  ASSLIABRT: "DEBT_ASSET_RATIO",
  EPSBASIC: "BASIC_EPS",
  PAIDINCAPI: "ISSUED_COMMON_SHARES",
  PERPROFIT: "OPERATE_PROFIT",
  CURFDS: "END_CASH",
  TOTASSET: "TOTAL_ASSETS",
  PARESHARRIGH: "TOTAL_PARENT_EQUITY",
  TOTLIABSHAREQUI: "TOTAL_ASSETS",
};

/**
 * 港股 fzb/lrb/llb 明细项字段映射（A-share item_field → STD_ITEM_NAME）
 * 按优先级：先查 fzb，再查 lrb，再查 llb
 */
interface HKDetailFieldDef {
  /** 数据源 */
  source: "fzb" | "lrb" | "llb";
  /** STD_ITEM_NAME 中文名称 */
  name: string;
}

const HK_DETAIL_FIELD_MAP: Record<string, HKDetailFieldDef[]> = {
  // ===== fzb 资产负债表 =====
  TOTCURRASSET: [{ source: "fzb", name: "流动资产合计" }],
  INVE: [{ source: "fzb", name: "存货" }],
  TOTALNONCASSETS: [{ source: "fzb", name: "非流动资产合计" }],
  NOTESACCOPAYA: [{ source: "fzb", name: "应付票据" }],
  LONGPAYA: [{ source: "fzb", name: "长期应付款" }],
  MINYSHARRIGH: [{ source: "fzb", name: "少数股东权益" }],
  FIXEDASSENETW: [{ source: "fzb", name: "物业厂房及设备" }],
  CONSPROG: [{ source: "fzb", name: "在建工程" }],
  INTAASSET: [{ source: "fzb", name: "无形资产" }],
  NOTESACCORECE: [{ source: "fzb", name: "应收帐款" }],
  PREP: [{ source: "fzb", name: "预付款项" }],
  ACCOPAYA: [{ source: "fzb", name: "应付帐款" }],
  GOODWILL: [{ source: "fzb", name: "商誉" }],
  // 融资租赁负债 = (流动 + 非流动)
  LEASELIAB: [
    { source: "fzb", name: "融资租赁负债(流动)" },
    { source: "fzb", name: "融资租赁负债(非流动)" },
  ],
  // 联营公司权益 + 合营公司权益 ≈ 长期股权投资
  EQUIINVE: [
    { source: "fzb", name: "联营公司权益" },
    { source: "fzb", name: "合营公司权益" },
  ],
  // 所有者权益合计 ≈ 净资产
  RIGHAGGR: [{ source: "fzb", name: "净资产" }],
  // 使用权资产（港股 FZB 中可能有或使用融资租赁替代）
  RUSEASSETS: [{ source: "fzb", name: "土地使用权" }],
  // 长期待摊费用（港股可能不单独列示）
  LOGPREPEXPE: [{ source: "fzb", name: "长期待摊费用" }],
  // 交易性金融资产 ≈ 指定以公允价值记账之金融资产(流动)
  TRADFINASSET: [{ source: "fzb", name: "指定以公允价值记账之金融资产(流动)" }],
  // 合同负债 ≈ 递延收入(流动) + 递延收入(非流动)
  CONTRACTLIAB: [
    { source: "fzb", name: "递延收入(流动)" },
    { source: "fzb", name: "递延收入(非流动)" },
  ],

  // ===== lrb 利润表 =====
  SALESEXPE: [{ source: "lrb", name: "销售及分销费用" }],
  MANAEXPE: [{ source: "lrb", name: "行政开支" }],
  INTEINCO: [{ source: "lrb", name: "利息收入" }],
  FINEXPE: [{ source: "lrb", name: "融资成本" }],
  INTERESTEXPENSE: [{ source: "lrb", name: "融资成本" }],
  INTEEXPE: [{ source: "lrb", name: "融资成本" }],
  // 投资收益 = 应占联营公司 + 应占合营公司 + 其他收益(含公允/汇兑)
  // 港股 IFRS 下利润表将投资收益、公允价值变动、汇兑收益合并为"其他收益"
  INVEINCO: [
    { source: "lrb", name: "应占联营公司溢利" },
    { source: "lrb", name: "应占合营公司溢利" },
    { source: "lrb", name: "其他收益" },
  ],
  // 以下单项不再单独映射，已包含在 INVEINCO（其他收益）中
  // VALUECHGLOSS/EXCHGGAIN 留空，避免重复计算
  // 少数股东损益
  MINORITYPROFIT: [{ source: "lrb", name: "少数股东损益" }],
  // 持续经营业务税后利润（用于 NPCUT 近似计算）
  CONTINUINGPROFIT: [{ source: "lrb", name: "持续经营业务税后利润" }],

  // ===== llb 现金流量表 =====
  // 经营业务现金净额
  MANANETR_LLB: [{ source: "llb", name: "经营业务现金净额" }],
  // CAPEX = 购建固定资产 + 购建无形资产及其他资产
  ACQUASSETCASH: [
    { source: "llb", name: "购建固定资产" },
    { source: "llb", name: "购建无形资产及其他资产" },
  ],
  // 折旧及摊销（来自间接法现金流量表补充资料）
  DEPRECIATION: [{ source: "llb", name: "加:折旧及摊销" }],
};

/**
 * 港股计算字段映射（A-share item_field → 计算函数）
 * 用于没有直接数据源、需要从已有字段推导的指标
 */
type HKComputedFieldFn = (dateValue: string, data: HKStockDataType) => number;

const HK_COMPUTED_FIELD_MAP: Record<string, HKComputedFieldFn> = {
  // 总资产周转率 = 营业收入 / 总资产（返回比率，与 A股 Sina 数据 scale 一致）
  TATURNRT: (dv, data) => {
    const rev = getHKFieldValue("BIZINCO", dv, data);
    const ta = getHKFieldValue("TOTASSET", dv, data);
    return ta > 0 ? rev / ta : 0;
  },
  // 期间费用率 = (销售费 + 管理费 + 财务费) / 营业收入 × 100
  TRIEXPRT: (dv, data) => {
    const rev = getHKFieldValue("BIZINCO", dv, data);
    const sell = getHKFieldValue("SALESEXPE", dv, data);
    const mgmt = getHKFieldValue("MANAEXPE", dv, data);
    const fin = getHKFieldValue("FINEXPE", dv, data);
    return rev > 0 ? ((sell + mgmt + fin) / rev) * 100 : 0;
  },
  // 营业成本 = 营业收入 - 毛利（gjzb 中 GROSS_PROFIT 已是毛利额）
  BIZCOST: (dv, data) => {
    const rev = getHKFieldValue("BIZINCO", dv, data);
    const entry = data.gjzb.find(
      (v) => v.REPORT_DATE.replace(/\s.*$/, "") === dv,
    );
    const gp = entry?.GROSS_PROFIT ?? 0;
    return rev - gp;
  },
  // 扣非净利润 ≈ 持续经营业务税后利润 - 少数股东损益
  // IFRS 无扣非概念，此为最接近的"经常性净利润"近似
  NPCUT: (dv, data) => {
    const continuingProfit = getHKFieldValue("CONTINUINGPROFIT", dv, data);
    const minorityProfit = getHKFieldValue("MINORITYPROFIT", dv, data);
    return continuingProfit - minorityProfit;
  },
};

/**
 * 港股数据访问器：根据 A-share item_field 从港股数据中获取值
 */
function getHKFieldValue(
  field: string,
  dateValue: string,
  data: HKStockDataType,
  key?: "item_value" | "item_tongbi",
  restrictToSource?: "fzb" | "lrb" | "llb",
): number {
  // tongbi 在港股数据中没有直接对应，intercept
  if (key === "item_tongbi") {
    // 尝试从 gjzb 中获取 YOY 字段
    const gjzbField = HK_GJZB_FIELD_MAP[field];
    if (gjzbField) {
      const yoyField = `${gjzbField}_YOY` as keyof HKGjzbItem;
      const entry = data.gjzb.find(
        (v) => v.REPORT_DATE.replace(/\s.*$/, "") === dateValue,
      );
      if (entry && entry[yoyField] != null) {
        return Number(entry[yoyField]) ?? 0;
      }
    }
    return 0;
  }

  // 1. 先查 gjzb（如果未限制数据源）
  if (!restrictToSource) {
    const gjzbField = HK_GJZB_FIELD_MAP[field];
    if (gjzbField) {
      const entry = data.gjzb.find(
        (v) => v.REPORT_DATE.replace(/\s.*$/, "") === dateValue,
      );
      if (entry && entry[gjzbField] != null) {
        return Number(entry[gjzbField]) ?? 0;
      }
    }
  }

  // 2. 查 fzb/lrb/llb 明细
  const detailDefs = HK_DETAIL_FIELD_MAP[field];
  if (detailDefs) {
    let total = 0;
    for (const def of detailDefs) {
      // 如果限制了数据源，跳过不匹配的
      if (restrictToSource && def.source !== restrictToSource) continue;

      let arr: HKDetailItem[];
      if (def.source === "fzb") arr = data.fzb;
      else if (def.source === "lrb") arr = data.lrb;
      else arr = data.llb;

      const items = arr.filter(
        (v) =>
          v.REPORT_DATE.replace(/\s.*$/, "") === dateValue &&
          v.STD_ITEM_NAME === def.name,
      );
      total += items.reduce((sum, v) => sum + (v.AMOUNT ?? 0), 0);
    }
    return total;
  }

  // 3. 查计算字段（从已有数据推导，不受 restrictToSource 限制）
  const computedFn = HK_COMPUTED_FIELD_MAP[field];
  if (computedFn) {
    return computedFn(dateValue, data);
  }

  return 0;
}

/**
 * 统一的数据访问器，兼容 A股 和 港股
 */
function getVal(dateValue: string, data: StockData) {
  // 港股数据使用独立访问器
  if (isHKStockData(data)) {
    return (
      field: string,
      options?: {
        b?: keyof SinaFinanceData;
        key?: keyof ReportDateItem;
      },
    ) => {
      // 港股不支持按 b 选项过滤数据源（gjzb/fzb/lrb/llb 是数组而非 SinaResponseData）
      // 仅在明细字段查找时指定来源
      const hkKey =
        options?.key === "item_tongbi" ? "item_tongbi" : "item_value";
      const sourceMap: Record<string, "fzb" | "lrb" | "llb"> = {
        fzb: "fzb",
        lrb: "lrb",
        llb: "llb",
      };
      const restrictToSource = options?.b
        ? sourceMap[options.b as string]
        : undefined;
      return getHKFieldValue(field, dateValue, data, hkKey, restrictToSource);
    };
  }

  // A股数据使用原有访问器
  return (
    field: string,
    options?: {
      b?: keyof SinaFinanceData;
      key?: keyof ReportDateItem;
    },
  ) => {
    const arr = options?.b
      ? [data[options.b]]
      : [data.gjzb, data.fzb, data.lrb, data.llb];
    for (const b of arr) {
      const reportData = b.report_list[dateValue];
      if (reportData) {
        const target = reportData.data.find((v) => v.item_field === field);
        if (target) {
          return Number(target[options?.key ? options.key : "item_value"]) ?? 0;
        }
      }
    }
    return 0;
  };
}

// 营收基本数据
function generateBasicRevenueData(data: StockData, quarterly = false) {
  const arr: BasicRevenueData[] = [];
  const isHK = isHKStockData(data);

  const report_date = getReportDates(data);
  for (let i = 0; i < report_date.length; i += 1) {
    const date = report_date[i];
    if (!date) continue;

    const shouldInclude = quarterly ? true : date.date_type === 4;
    if (shouldInclude) {
      const val = getVal(date.date_value, data);

      const revenue = val("BIZINCO");
      const netProfit = val("PARENETP");
      const netProfitExcludingNon = val("NPCUT");
      const cashFlowFromOperating = val("MANANETR");
      // 购建固定资产、无形资产和其他长期资产所支付的现金
      const capex = val("ACQUASSETCASH");

      let coreProfit: number;
      let financialProfit: number;

      if (isHK) {
        // 港股 IFRS 口径：核心利润 = 毛利 - 销售费用 - 管理费用（行政开支）
        // 因为在 IFRS 下营业成本、税金等已包含在毛利计算中
        coreProfit =
          (val("SGPMARGIN") / 100) * revenue -
          val("SALESEXPE") -
          val("MANAEXPE");
        // 港股金融利润：利息收入 + 投资/其他收益 - 融资成本
        // INVEINCO 已包含：应占联营公司溢利 + 应占合营公司溢利 + 其他收益
        financialProfit = val("INTEINCO") + val("INVEINCO") - val("FINEXPE");
      } else {
        // A股口径
        coreProfit =
          revenue -
          val("BIZCOST") -
          val("BIZTAX") -
          val("SALESEXPE") -
          val("MANAEXPE") -
          val("DEVEEXPE") -
          (val("FINEXPE") > 0 ? val("INTERESTEXPENSE") : 0);
        financialProfit =
          val("INTEINCO") +
          val("INTEEXPE") +
          val("INVEINCO") +
          val("VALUECHGLOSS") +
          val("EXCHGGAIN");
      }

      // 利息收入 + 利息支出 + 投资收益 + 公允价值变动收益 + 汇兑收益
      const fcf = cashFlowFromOperating - capex;
      const operatingProfit = netProfit - financialProfit;

      arr.push({
        year: formatYear(date),
        revenue,
        netProfit,
        netProfitMargin: netProfit / revenue, // 净利润率
        netProfitExcludingNon, // 扣非净利润
        coreProfit, // 核心利润
        cashFlowFromOperating, // 经营净现金流
        fcf, // 自由现金流
        capex, // CAPEX
        fcfOverNetProfit: netProfit > 0 ? fcf / netProfit : 0, // 自由现金流/归母净利润
        netProfitExcludingNonOvernetProfit:
          netProfit > 0 ? netProfitExcludingNon / netProfit : 0, // 扣非净利润/归母净利润
        cashFlowFromOperatingOverNetProfit:
          netProfit > 0 ? cashFlowFromOperating / netProfit : 0, // 经营现金流/归母净利润
        operatingProfit, // 经营利润
        financialProfit, // 金融利润
        operatingProfitOverNetProfit:
          netProfit > 0 ? operatingProfit / netProfit : 0, // 经营利润/归母净利润
      });
    }
  }

  return arr;
}

function generateCostsExpensesData(data: StockData, quarterly = false) {
  const arr: CostsExpensesData[] = [];

  const report_date = getReportDates(data);
  for (let i = 0; i < report_date.length; i += 1) {
    const date = report_date[i];
    if (!date) continue;

    const shouldInclude = quarterly ? true : date.date_type === 4;
    if (shouldInclude) {
      const val = getVal(date.date_value, data);

      const revenue = val("BIZINCO");
      const netProfit = val("PARENETP");
      const grossProfitMargin = val("SGPMARGIN");
      const netProfitMargin = (netProfit / revenue) * 100;
      const devExpenses = val("DEVEEXPE", { b: "lrb" }) ?? 0;
      const manageExpenses = val("MANAEXPE");
      const sellingExpenses = val("SALESEXPE");
      const financialExpenses = val("FINEXPE");
      const devAndManageExpenses = devExpenses + manageExpenses;
      const totalOperatingExpenses =
        devAndManageExpenses + sellingExpenses + financialExpenses;

      arr.push({
        year: formatYear(date),
        grossProfitMargin, // 毛利率
        netProfitMargin, // 净利率
        grossProfitMinusNetProfit: grossProfitMargin - netProfitMargin, // 毛利率-净利润率
        devExpenses, // 研发费用
        manageExpenses, // 管理费用
        devAndManageExpenses, // 管理研发费用
        sellingExpenses, // 销售费用
        financialExpenses, // 财务费用
        totalOperatingExpenses, // 期间费用合计
        sellingExpensesRatio: sellingExpenses / revenue, // 销售费用率
        devExpensesRatio: devExpenses / revenue, // 研发费用率
        manageExpensesRatio: manageExpenses / revenue, // 管理费用率
        devAndManageExpensesRatio: devAndManageExpenses / revenue, // 管理研发费用率
        totalOperatingExpensesRatio: val("TRIEXPRT"), // 期间费用率
      });
    }
  }

  return arr;
}

function generateBalanceData(data: StockData, quarterly = false) {
  const arr: BalanceData[] = [];

  const report_date = getReportDates(data);
  for (let i = 0; i < report_date.length; i += 1) {
    const date = report_date[i];
    if (!date) continue;

    const shouldInclude = quarterly ? true : date.date_type === 4;
    if (shouldInclude) {
      const val = getVal(date.date_value, data);

      const currentAssets = val("TOTCURRASSET");
      const cash = val("CURFDS");
      const inventory = val("INVE");
      const nonCurrentAssets = val("TOTALNONCASSETS");
      const totalAssets = val("TOTASSET");
      const equity = val("PARESHARRIGH");
      // 无息负债（应付+预收+合同）
      const interestFreeLiabilities =
        val("NOTESACCOPAYA") + val("ADVAPAYM") + val("CONTRACTLIAB");
      /**
       * 短期借款（几乎总是有息负债）
       * 一年内到期的非流动负债（通常，其大部分构成源自长期借款、应付债券等有息负债的到期部分，因此整体上常被视为有息流动负债。）
       * 长期借款（几乎总是有息负债）
       * 应付票据 （快速分析时，可保守地将所有应付票据计入，因为银承占比较高）
       * 长期应付款（长期应付款实务中更常见的是有息性质）
       * 应付债券（总是有息负债）
       * 租赁负债
       * 其他非流动负债（高度依赖具体内容，可能包含有息部分，也可能主要是无息部分）
       */
      const interestBearingDebt =
        val("SHORTTERMBORR") +
        val("DUENONCLIAB") +
        val("LONGBORR") +
        // val("NOTESPAYA") +
        val("LONGPAYA") +
        val("BDSPAYA") +
        val("LEASELIAB");
      // val("OTHERNONCLIABI");
      const interestExpense = val("INTERESTEXPENSE") ?? 0;

      const debtRatio = val("ASSLIABRT");
      const goodwill = val("GOODWILL");

      arr.push({
        year: formatYear(date),
        currentAssets, // 流动资产
        cash, // 现金
        inventory, // 存货
        nonCurrentAssets, // 非流动资产
        goodwill, // 商誉
        totalAssets, // 总资产
        equity, // 归母净资产
        interestFreeLiabilities, // 无息负债（应付+预收+合同）
        interestBearingDebt, // 有息负债
        interestExpense, // 利息费用
        interestFreeLiabilitiesOverTotal: interestFreeLiabilities / totalAssets, // 无息/总资产
        interestBearingDebtOverTotal: interestBearingDebt / totalAssets, // 有息/总资产
        debtRatio, // 资产负债率
      });
    }
  }

  return arr;
}

function generateWorkingCapitalData(data: StockData, quarterly = false) {
  const arr: WorkingCapitalData[] = [];
  let prevWc = 0;

  const report_date = getReportDates(data);
  for (let i = report_date.length - 1; i >= 0; i -= 1) {
    const date = report_date[i];
    if (!date) continue;

    const shouldInclude = quarterly ? true : date.date_type === 4;
    if (shouldInclude) {
      const val = getVal(date.date_value, data);

      const revenue = val("BIZINCO");
      // 应收票据及应收账款 + 应收款项融资
      const receivables = val("NOTESACCORECE") + val("RECFINANC");
      const prepayments = val("PREP");
      const inventory = val("INVE");
      // 《简明财务分析》取的是应付账款，里面有说简化可以直接取应付账款
      const accountsPayable = val("ACCOPAYA");
      const customerAdvances = val("ADVAPAYM");
      const contractLiabilities = val("CONTRACTLIAB");

      // WC=应收账款和票据+预付账款+存货+合同资产-应付账款和票据-预收账款-合同负债
      // NOTICE：《简明财务分析》取的是应付账款，里面有说简化可以直接取应付账款
      const wc =
        receivables +
        prepayments +
        inventory +
        val("CONTRACTASSET") -
        val("ACCOPAYA") -
        customerAdvances -
        contractLiabilities;

      arr.unshift({
        year: formatYear(date),
        wcPerYuanRevenue: wc / revenue, // 1元收入需要的WC
        wc, // WC
        receivables, // 应收
        prepayments, // 预付
        inventory, // 存货
        accountsPayable, // 应付
        customerAdvances, // 预收
        contractLiabilities, // 合同负债
        receivablesToRevenueRatio: receivables / revenue, // 应收占收入比重
        prepaymentsToRevenueRatio: prepayments / revenue, // 预付占收入比重
        inventoryToRevenueRatio: inventory / revenue, // 存货占收入比重
        accountsPayableToRevenueRatio: accountsPayable / revenue, // 应付占收入比重
        advancesToRevenueRatio: customerAdvances / revenue, // 预收占收入比重·
        contractLiabilitiesToRevenueRatio: contractLiabilities / revenue, // 合同负债占收入比重
        changeInWC: wc - prevWc, // 新增WC
      });

      prevWc = wc;
    }
  }

  return arr;
}

function generateFixedAssetInvestmentAnalysisData(data: StockData, quarterly = false) {
  const arr: FixedAssetInvestmentAnalysisData[] = [];

  const report_date = getReportDates(data);
  for (let i = 0; i < report_date.length; i += 1) {
    const date = report_date[i];
    if (!date) continue;

    const shouldInclude = quarterly ? true : date.date_type === 4;
    if (shouldInclude) {
      const val = getVal(date.date_value, data);

      const revenue = val("BIZINCO");

      // 固定资产=资产负债表上的固定资产+在建工程+工程物资-固定资产清理
      // 9.15
      const fixedAssets =
        val("FIXEDASSENETW") +
        val("CONSPROG") +
        val("ENGIMATE") -
        val("FIXEDASSECLEA");

      // 长期资产=固定资产+资产负债表其他长期经营资产（无形资产+开发费+使用权资产+商誉+长期待摊）
      const longTermOperatingAssets =
        fixedAssets +
        val("INTAASSET", { b: "fzb" }) +
        val("DEVEEXPE", { b: "fzb" }) +
        val("RUSEASSETS", { b: "fzb" }) +
        val("GOODWILL", { b: "fzb" }) +
        val("LOGPREPEXPE", { b: "fzb" });

      // 补充资料才有这项，要取东方财富财报的现金流量表下的补充资料中才能找到
      // 应该取得是：将净利润调节为经营活动现金流量 下的 固定资产折旧、油气资产折耗、生产性生物资产折旧;
      let depreciation = 0;
      if (isHKStockData(data)) {
        // 港股：从 LLB 间接法补充资料中获取 "加:折旧及摊销"
        depreciation = val("DEPRECIATION");
      } else {
        const target = data.eastMoneyCashFlow.find(
          (v) => formatDate(v.REPORT_DATE, "Ymd") === date.date_value,
        );
        if (target) {
          depreciation = amortize(target);
        }
      }

      arr.push({
        year: formatYear(date),
        fixedAssetsPerYuanRevenue: fixedAssets / revenue, // 1 元收入需要的固定资产
        longTermOperatingAssetsPerYuanRevenue:
          longTermOperatingAssets / revenue, // 1 元收入需要的长期资产
        fixedAssets, // 固定资产
        longTermOperatingAssets, // 长期经营资产
        depreciation, // 折旧
        depreciationOverRevenue: depreciation / revenue, // 折旧/收入
      });
    }
  }

  return arr;
}

function generateReturnData(data: StockData, quarterly = false) {
  const arr: ReturnData[] = [];
  let prevCapitalEmployed = 0;

  const report_date = getReportDates(data);
  // 从旧到新遍历，便于计算年度平均已动用资本 =（期初 + 期末）÷ 2
  for (let i = report_date.length - 1; i >= 0; i -= 1) {
    const date = report_date[i];
    if (!date) continue;

    const shouldInclude = quarterly ? true : date.date_type === 4;
    if (shouldInclude) {
      const val = getVal(date.date_value, data);

      const roe = val("ROEWEIGHTED");
      const roa = val("ROA");
      const roic = val("ROIC");
      const netProfitMargin = val("SNPMARGINCONMS");
      const assetTurnover = val("TATURNRT") * 100;
      const equityMultiplier = val("EMCONMS");

      // EBIT = 营业利润 + 财务费用明细下的利息费用
      const ebit = val("PERPROFIT") + val("INTERESTEXPENSE");
      // 期末已动用资本 = 所有者权益合计 + 短期借款 + 一年内到期的非流动负债 + 长期借款 + 应付债券
      const capitalEmployed =
        val("RIGHAGGR") +
        val("SHORTTERMBORR") +
        val("DUENONCLIAB") +
        val("LONGBORR") +
        val("BDSPAYA");
      // 年度平均已动用资本 =（期初 + 期末）÷ 2，期初取上一年的期末值
      const avgCapitalEmployed =
        prevCapitalEmployed > 0
          ? (capitalEmployed + prevCapitalEmployed) / 2
          : capitalEmployed;
      const roce =
        avgCapitalEmployed > 0 ? (ebit / avgCapitalEmployed) * 100 : 0;

      arr.unshift({
        year: formatYear(date),
        roe, // ROE
        roa, // ROA
        roic, // ROIC
        roce, // ROCE
        netProfitMargin, // 销售净利率
        assetTurnover, // 资产周转率
        equityMultiplier, // 权益乘数
      });

      prevCapitalEmployed = capitalEmployed;
    }
  }

  return arr;
}

function generateTurnoverRateData(data: StockData, quarterly = false) {
  const arr: TurnoverRateData[] = [];
  let prevTotalAssets = 0;
  let prevCurrentAssets = 0;
  let prevInventory = 0;
  let prevEquity = 0;
  let prevFixedAssets = 0;

  const report_date = getReportDates(data);
  for (let i = report_date.length - 1; i >= 0; i -= 1) {
    const date = report_date[i];
    if (!date) continue;

    const shouldInclude = quarterly ? true : date.date_type === 4;
    if (shouldInclude) {
      const val = getVal(date.date_value, data);

      const revenue = val("BIZINCO");
      const totalAssets = val("TOTLIABSHAREQUI");
      const avgTotalAssets =
        prevTotalAssets > 0 ? (totalAssets + prevTotalAssets) / 2 : totalAssets;

      const currentAssets = val("TOTCURRASSET");
      const avgCurrentAssets =
        prevTotalAssets > 0
          ? (currentAssets + prevCurrentAssets) / 2
          : currentAssets;

      const inventory = val("INVE");
      const avgInventory =
        prevInventory > 0 ? (inventory + prevInventory) / 2 : inventory;

      const equity = val("RIGHAGGR");
      const avgEquity = prevEquity > 0 ? (equity + prevEquity) / 2 : equity;

      const totalAssetsDays = val("TATURNDAYS");
      const currentAssetsDays = val("CURASSTURNDAYS");
      const receivablesDays = val("ACCRECGTURNDAYS");
      const inventoryDays = val("INVTURNDAYS");

      // 应收票据及应收账款 + 应收款项融资
      const receivables = val("NOTESACCORECE") + val("RECFINANC");
      const prepayments = val("PREP");

      const customerAdvances = val("ADVAPAYM");
      const contractLiabilities = val("CONTRACTLIAB");

      // WC=应收账款和票据+预付账款+存货+合同资产-应付账款和票据-预收账款-合同负债
      // NOTICE：《简明财务分析》取的是应付账款，里面有说简化可以直接取应付账款
      const wc =
        receivables +
        prepayments +
        inventory +
        val("CONTRACTASSET") -
        val("ACCOPAYA") -
        customerAdvances -
        contractLiabilities;

      const wcDays = 365 / (revenue / wc);

      // 固定资产=资产负债表上的固定资产+在建工程+工程物资-固定资产清理
      const fixedAssets =
        val("FIXEDASSENETW") +
        val("CONSPROG") +
        val("ENGIMATE") -
        val("FIXEDASSECLEA");

      // 365 / 固定资产周转率
      const fixedAssetsDays = 365 / (revenue / fixedAssets);

      arr.unshift({
        year: formatYear(date),
        totalAssets, // 总资产
        avgTotalAssets, // 平均总资产
        avgCurrentAssets, // 平均流动资产
        avgInventory, // 平均存货
        equity, // 归母净资产
        avgEquity, // 平均归母净资产
        totalAssetsDays, // 总资产周转天数
        currentAssetsDays, // 流动资产周转天数
        wcDays, // WC 周转天数
        receivablesDays, // 应收周转天数
        inventoryDays, // 存货周转天数
        fixedAssetsDays, // 固定资产周转天数
      });

      prevTotalAssets = totalAssets;
      prevCurrentAssets = currentAssets;
      prevInventory = inventory;
      prevEquity = equity;
      prevFixedAssets = fixedAssets;
    }
  }

  return arr;
}

/**
 * 主营业务
 */
function generatePrimaryBusinessData(data: StockData) {
  const arr: PrimaryBusinessData[] = [];

  // 港股没有主营业务数据，直接返回空数组
  if (!data.primaryBusiness || data.primaryBusiness.length === 0) {
    return arr;
  }

  const firstYear = data.primaryBusiness.find((v) =>
    formatDate(v.REPORT_DATE, "Ymd").endsWith("1231"),
  );
  const firstYearDate = formatDate(firstYear?.REPORT_DATE, "Ymd");

  for (const item of data.primaryBusiness) {
    const reportDate = formatDate(item.REPORT_DATE, "Ymd");
    if (!reportDate.endsWith("1231")) {
      continue;
    }

    // 如果超过十年的数据就不要了
    if (Number(reportDate) < Number(firstYearDate) - 90000) {
      break;
    }

    const mainType = {
      1: "行业",
      2: "产品",
      3: "地区",
    }[item.MAINOP_TYPE];

    arr.push({
      year: formatDate(item.REPORT_DATE, "Y"), // 年份
      mainType, // 行业、产品、地区
      itemName: item.ITEM_NAME ?? "", // 类型
      mainBusinessIncome: item.MAIN_BUSINESS_INCOME ?? 0, // 主营收入
      mbiRatio: item.MBI_RATIO ?? 0, // 收入比例
      mainBusinessCost: item.MAIN_BUSINESS_COST ?? 0, // 主营成本
      mbcRatio: item.MBC_RATIO ?? 0, // 成本比例
      mainBusinessProfit: item.MAIN_BUSINESS_RPOFIT ?? 0, // 主营利润
      mbpRatio: item.MBR_RATIO ?? 0, // 利润比例
      grossProfitRatio: item.GROSS_RPOFIT_RATIO ?? 0, // 毛利率
    });
  }

  return arr;
}

/**
 * 港股分红方案解析（格式："每股派港币0.66元"）
 */
function parseHKDividend(planExplain: string): number {
  const match = planExplain.match(/每股派港[元幣币]\s*([\d.]+)/);
  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  return 0;
}

/**
 * 估值数据
 */
function generateVauationData(data: StockData): ValuationData {
  const historyData: ValuationHistoryData[] = [];
  const report_date = getReportDates(data);
  const isHK = isHKStockData(data);

  for (const date of report_date.slice().reverse()) {
    if (date.date_type === 4) {
      const val = getVal(date.date_value, data);

      let dps = 0;
      let totalDividend = 0;
      let totalDividendA = 0;

      if (isHK && Array.isArray(data.dividendData)) {
        // 港股分红数据处理
        const year = date.date_value.slice(0, 4);
        const hkDividends = data.dividendData as EastMoneyHKDividendResponse[];
        const arr = hkDividends.filter((v) => v.YEAR === year);

        dps = arr.reduce((pre, cur) => {
          if (cur.PLAN_EXPLAIN) {
            return pre + parseHKDividend(cur.PLAN_EXPLAIN);
          }
          return pre;
        }, 0);
        // 港股没有 TOTAL_DIVIDEND 字段，用每股分红 * 总股本估算
        const shares = val("PAIDINCAPI");
        totalDividend = dps * shares;
      } else if (Array.isArray(data.dividendData)) {
        // A股分红数据处理（已排除港股，此处为 A股格式）
        const aShareDividends = data.dividendData as any[];
        const arr = aShareDividends.filter(
          (v) => v.REPORT_DATE.slice(0, 4) === date.date_value.slice(0, 4),
        );

        dps = arr.reduce((pre, cur) => {
          if (cur.IMPL_PLAN_PROFILE) {
            const dividend = getPayVal(cur.IMPL_PLAN_PROFILE);
            return pre + dividend;
          }
          return pre;
        }, 0);

        const target = arr.find(
          (v) => v.REPORT_DATE === `${date.date_value.slice(0, 4)}年报`,
        );
        if (target) {
          totalDividend = target.TOTAL_DIVIDEND;
          totalDividendA = target.TOTAL_DIVIDEND_A;
        }
      }

      const PARENETP = val("PARENETP");

      historyData.push({
        year: formatYear(date),
        profit: val("PARENETP"),
        profit_tb: val("PARENETP", { key: "item_tongbi" }) ?? 0,
        basicEps: val("EPSBASIC"),
        totalSharesOutstanding: val("PAIDINCAPI"),
        dps,
        dividendRatio: PARENETP > 0 ? totalDividend / val("PARENETP") : 0,
        totalDividend,
        totalDividendA,
      });
    }
  }

  const lastDateValue = report_date[0]?.date_value!;
  const lastVal = getVal(lastDateValue, data);
  const cash = lastVal("CURFDS");
  const tradingFinancialAssets = lastVal("TRADFINASSET");
  const longTermEquityInvestment = lastVal("EQUIINVE");

  const totalAssets = lastVal("TOTASSET");
  /**
   * 短期借款（几乎总是有息负债）
   * 一年内到期的非流动负债（通常，其大部分构成源自长期借款、应付债券等有息负债的到期部分，因此整体上常被视为有息流动负债）
   * 长期借款（几乎总是有息负债）
   * 应付票据 （快速分析时，可保守地将所有应付票据计入，因为银承占比较高）
   * 长期应付款（长期应付款实务中更常见的是有息性质）
   * 应付债券（总是有息负债）
   * 租赁负债
   * 其他非流动负债（高度依赖具体内容，可能包含有息部分，也可能主要是无息部分）
   */
  const interestBearingDebt =
    lastVal("SHORTTERMBORR") +
    lastVal("DUENONCLIAB") +
    lastVal("LONGBORR") +
    // lastVal("NOTESPAYA") +
    lastVal("LONGPAYA") +
    lastVal("BDSPAYA") +
    lastVal("LEASELIAB");
  // lastVal("OTHERNONCLIABI");

  const debtRatio = lastVal("ASSLIABRT");
  const minorityInterest = lastVal("MINYSHARRIGH");

  const lastYearDateValue = report_date.find(
    (v) => v.date_type === 4,
  )!.date_value;
  const lastYearVal = getVal(lastYearDateValue, data);
  const roe = lastYearVal("ROEWEIGHTED");
  const roa = lastYearVal("ROA");
  const roic = lastYearVal("ROIC");
  const grossProfitMargin = lastYearVal("SGPMARGIN");
  const netProfitMargin = lastYearVal("SNPMARGINCONMS");

  return {
    historyData: historyData.slice(-10),
    cash,
    interestBearingDebt, // 有息负债
    debtRatio,
    interestBearingDebtOverTotal: interestBearingDebt / totalAssets, // 有息/总资产
    roe,
    roic,
    roa,
    grossProfitMargin,
    netProfitMargin,
    tradingFinancialAssets,
    longTermEquityInvestment,
    minorityInterest,
  };
}

/**
 * 获取最近一年数据
 */
function generateRecentYearData(item: {
  code: string;
  data: StockData;
}): RecentYearData {
  let netProfit = 0;
  const { code, data } = item;
  const isBank = code === "600036";
  const netProfitKey = isBank ? "NETPARECOMPPROF" : "PARENETP";

  const report_date = getReportDates(data);
  const dates = report_date.slice(0, 5);
  for (let i = 0; i < 4; i += 1) {
    const item = dates[i]!;
    const prevItem = dates[i + 1]!;
    if (!prevItem) break;

    const val = getVal(item.date_value, data);
    const lastVal = getVal(prevItem.date_value, data);

    if (item.date_type === prevItem.date_type + 1) {
      // 计算单个季度数据并累加
      netProfit += val(netProfitKey) - lastVal(netProfitKey);
    }
    // 如果不是连续的报告期，则直接相加
    else {
      netProfit += val(netProfitKey);
    }
  }

  return {
    netProfit,
  };
}

(async () => {
  const allStockData = await loadAllStockData();
  const data: ServiceData = {};

  for (const stockData of allStockData) {
    const basicRevenueData = generateBasicRevenueData(stockData.data);
    const basicRevenueDataQuarterly = generateBasicRevenueData(stockData.data, true);
    const costsExpensesData = generateCostsExpensesData(stockData.data);
    const costsExpensesDataQuarterly = generateCostsExpensesData(stockData.data, true);
    const balanceData = generateBalanceData(stockData.data);
    const balanceDataQuarterly = generateBalanceData(stockData.data, true);
    const workingCapitalData = generateWorkingCapitalData(stockData.data);
    const workingCapitalDataQuarterly = generateWorkingCapitalData(stockData.data, true);
    const fixedAssetInvestmentAnalysisData =
      generateFixedAssetInvestmentAnalysisData(stockData.data);
    const fixedAssetInvestmentAnalysisDataQuarterly =
      generateFixedAssetInvestmentAnalysisData(stockData.data, true);
    const returnData = generateReturnData(stockData.data);
    const returnDataQuarterly = generateReturnData(stockData.data, true);
    const turnoverRateData = generateTurnoverRateData(stockData.data);
    const turnoverRateDataQuarterly = generateTurnoverRateData(stockData.data, true);
    const primaryBusinessData = generatePrimaryBusinessData(stockData.data);
    const valuationData = generateVauationData(stockData.data);
    const dynamicData = stockData.data.dynamicData;
    const recentYearData = generateRecentYearData(stockData);

    data[stockData.code] = {
      basicRevenueData: basicRevenueData.slice(0, 11),
      basicRevenueDataQuarterly: basicRevenueDataQuarterly.slice(0, 48),
      costsExpensesData: costsExpensesData.slice(0, 11),
      costsExpensesDataQuarterly: costsExpensesDataQuarterly.slice(0, 48),
      balanceData: balanceData.slice(0, 11),
      balanceDataQuarterly: balanceDataQuarterly.slice(0, 48),
      workingCapitalData: workingCapitalData.slice(0, 11),
      workingCapitalDataQuarterly: workingCapitalDataQuarterly.slice(0, 48),
      fixedAssetInvestmentAnalysisData: fixedAssetInvestmentAnalysisData.slice(
        0,
        11,
      ),
      fixedAssetInvestmentAnalysisDataQuarterly:
        fixedAssetInvestmentAnalysisDataQuarterly.slice(0, 48),
      returnData: returnData.slice(0, 11),
      returnDataQuarterly: returnDataQuarterly.slice(0, 48),
      turnoverRateData: turnoverRateData.slice(0, 11),
      turnoverRateDataQuarterly: turnoverRateDataQuarterly.slice(0, 48),
      primaryBusinessData: primaryBusinessData,
      valuationData,
      dynamicData,
      recentYearData,
    };
  }

  saveDataToTsFileAsync(data, "./.vitepress/service/data.ts");
})();
