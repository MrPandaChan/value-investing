import formatDate, { amortize, getPayVal } from "./helper";
import { loadAllStockData } from "./load-all-data";
import { saveDataToTsFileAsync } from "./save-data";
import type {
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

function getVal(dateValue: string, data: StockData) {
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

function formatYear(date: SinaResponseDataReportDate) {
  const year = date.date_value.substring(0, 4);
  return date.date_type < 4 ? `${year}Q${date.date_type}` : year;
}

// 营收基本数据
function generateBasicRevenueData(data: StockData) {
  const arr: BasicRevenueData[] = [];

  const { report_date } = data.gjzb;
  for (let i = 0; i < report_date.length; i += 1) {
    const date = report_date[i];
    if (!date) continue;

    if (date.date_type === 4 || i === 0) {
      const val = getVal(date.date_value, data);

      const revenue = val("BIZINCO");
      const netProfit = val("PARENETP");
      const netProfitExcludingNon = val("NPCUT");
      const cashFlowFromOperating = val("MANANETR");
      // 购建固定资产、无形资产和其他长期资产所支付的现金
      const capex = val("ACQUASSETCASH");
      // // 核心利润 = 营业收入 - 营业成本 - 税金及附加 - 销售费用 - 管理费用 - 研发费用 - 利息费用（财务费用为正则扣除，为负则不加回）
      const coreProfit =
        revenue -
        val("BIZCOST") -
        val("BIZTAX") -
        val("SALESEXPE") -
        val("MANAEXPE") -
        val("DEVEEXPE") -
        (val("FINEXPE") > 0 ? val("INTERESTEXPENSE") : 0);
      // 利息收入 + 利息支出 + 投资收益 + 公允价值变动收益 + 汇兑收益
      const fcf = cashFlowFromOperating - capex;
      const financialProfit =
        val("INTEINCO") +
        val("INTEEXPE") +
        val("INVEINCO") +
        val("VALUECHGLOSS") +
        val("EXCHGGAIN");
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

function generateCostsExpensesData(data: StockData) {
  const arr: CostsExpensesData[] = [];

  const { report_date } = data.gjzb;
  for (let i = 0; i < report_date.length; i += 1) {
    const date = report_date[i];
    if (!date) continue;

    if (date.date_type === 4 || i === 0) {
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

function generateBalanceData(data: StockData) {
  const arr: BalanceData[] = [];

  const { report_date } = data.gjzb;
  for (let i = 0; i < report_date.length; i += 1) {
    const date = report_date[i];
    if (!date) continue;

    if (date.date_type === 4 || i === 0) {
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

function generateWorkingCapitalData(data: StockData) {
  const arr: WorkingCapitalData[] = [];
  let prevWc = 0;

  const { report_date } = data.gjzb;
  for (let i = report_date.length - 1; i >= 0; i -= 1) {
    const date = report_date[i];
    if (!date) continue;

    if (date.date_type === 4 || i === 0) {
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

function generateFixedAssetInvestmentAnalysisData(data: StockData) {
  const arr: FixedAssetInvestmentAnalysisData[] = [];

  const { report_date } = data.gjzb;
  for (let i = 0; i < report_date.length; i += 1) {
    const date = report_date[i];
    if (!date) continue;

    if (date.date_type === 4 || i === 0) {
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
      const target = data.eastMoneyCashFlow.find(
        (v) => formatDate(v.REPORT_DATE, "Ymd") === date.date_value,
      );
      if (target) {
        depreciation = amortize(target);
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

function generateReturnData(data: StockData) {
  const arr: ReturnData[] = [];
  let prevCapitalEmployed = 0;

  const { report_date } = data.gjzb;
  // 从旧到新遍历，便于计算年度平均已动用资本 =（期初 + 期末）÷ 2
  for (let i = report_date.length - 1; i >= 0; i -= 1) {
    const date = report_date[i];
    if (!date) continue;

    if (date.date_type === 4 || i === 0) {
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

function generateTurnoverRateData(data: StockData) {
  const arr: TurnoverRateData[] = [];
  let prevTotalAssets = 0;
  let prevCurrentAssets = 0;
  let prevInventory = 0;
  let prevEquity = 0;
  let prevFixedAssets = 0;

  const { report_date } = data.gjzb;
  for (let i = report_date.length - 1; i >= 0; i -= 1) {
    const date = report_date[i];
    if (!date) continue;

    if (date.date_type === 4 || i === 0) {
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
 * 估值数据
 */
function generateVauationData(data: StockData): ValuationData {
  const historyData: ValuationHistoryData[] = [];

  for (const date of data.gjzb.report_date.slice().reverse()) {
    if (date.date_type === 4) {
      const val = getVal(date.date_value, data);

      let dps = 0;
      let totalDividend = 0;
      let totalDividendA = 0;
      if (Array.isArray(data.dividendData)) {
        const arr = data.dividendData.filter(
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
  const lastDateValue = data.gjzb.report_date[0]?.date_value!;

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

  const lastYearDateValue = data.gjzb.report_date.find(
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

  const dates = data.gjzb.report_date.slice(0, 5);
  for (let i = 0; i < 4; i += 1) {
    const item = dates[i]!;
    const prevItem = dates[i + 1]!;

    const val = getVal(item.date_value, data);
    const lastVal = getVal(prevItem!.date_value, data);

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
    const costsExpensesData = generateCostsExpensesData(stockData.data);
    const balanceData = generateBalanceData(stockData.data);
    const workingCapitalData = generateWorkingCapitalData(stockData.data);
    const fixedAssetInvestmentAnalysisData =
      generateFixedAssetInvestmentAnalysisData(stockData.data);
    const returnData = generateReturnData(stockData.data);
    const turnoverRateData = generateTurnoverRateData(stockData.data);
    const primaryBusinessData = generatePrimaryBusinessData(stockData.data);
    const valuationData = generateVauationData(stockData.data);
    const dynamicData = stockData.data.dynamicData;
    const recentYearData = generateRecentYearData(stockData);

    data[stockData.code] = {
      basicRevenueData: basicRevenueData.slice(0, 11),
      costsExpensesData: costsExpensesData.slice(0, 11),
      balanceData: balanceData.slice(0, 11),
      workingCapitalData: workingCapitalData.slice(0, 11),
      fixedAssetInvestmentAnalysisData: fixedAssetInvestmentAnalysisData.slice(
        0,
        11,
      ),
      returnData: returnData.slice(0, 11),
      turnoverRateData: turnoverRateData.slice(0, 11),
      primaryBusinessData: primaryBusinessData,
      valuationData,
      dynamicData,
      recentYearData,
    };
  }

  saveDataToTsFileAsync(data, "./.vitepress/service/data.ts");
})();
