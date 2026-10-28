import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { data } from "../../service/data";
import { stocks } from "../../my-data/stock-pool";
import type { ValuationHistoryData } from "../../../types";
import { canConvertToCNY } from "../../../fetch-data/helper";
import { getEffectiveEventDps, type ExItem } from "./fetch-dividend";
import { usePortfolioBase, type HoldingBase } from "./use-portfolio-base";

/** 历史数据窗口（年报），与 handle-stock-data 的 slice(-10) 保持一致 */
const HISTORY_YEARS = 10;

/** 单只持仓的历史业绩（按当前股本折算，避免送转股导致 EPS 不可比） */
export interface CompanyHistory {
  code: string;
  name: string;
  industry: string;
  sharesHeld: number;
  /** 占当前分母（股票市值，可选含现金）的比例 */
  weight: number;
  hasData: boolean;
  /** 应占净利润（人民币/元） */
  profitByYear: Record<string, number>;
  /** 应占归母净资产（人民币/元），缺失年份不写入 */
  equityByYear: Record<string, number>;
  /** 应占股息（人民币/元） */
  dividendByYear: Record<string, number>;
  /** 股息税（人民币/元，按 dividendAdjust 估算） */
  taxByYear: Record<string, number>;
  /** 按当前股本折算的每股净利润（人民币/元） */
  epsByYear: Record<string, number>;
  years: string[];
  /** 每股净利润复合增速 */
  epsCagr: number | null;
}

/** 组合层某一年度的透视盈余 */
export interface PortfolioYearRow {
  year: string;
  /** 应占净利润（元） */
  profit: number;
  /** 透视盈余 = 应占净利润 - 股息税（元） */
  surplus: number;
  /** 应占归母净资产（元），仅统计有净资产数据的公司 */
  equity: number;
  /** 组合 ROE = 有净资产数据公司的应占净利润 / 应占净资产 */
  roe: number | null;
  /** 按当前市值：透视盈余收益率 */
  surplusYield: number;
  /** 按当前市值：隐含 PE */
  impliedPE: number | null;
  /** 应占股息（元） */
  dividend: number;
  /** 股息税（元） */
  tax: number;
  /** 留存利润 = 应占净利润 - 应占股息（元） */
  retained: number;
  /** 分红率（税前）= 应占股息 / 应占净利润，未扣股息税 */
  payoutRatio: number | null;
  /** 同比 */
  yoy: number | null;
  /** 该年度有数据的持仓权重（分母含 ETF/现金时为 < 1） */
  coveredWeight: number;
}

/** 不参与透视盈余的持仓快照（ETF 与现金） */
export interface SnapshotHolding {
  code: string;
  name: string;
  sharesHeld: number;
  price: number;
  holdingValue: number;
  weight: number;
  /** 近 12 个月分红（人民币） */
  dividend: number;
  /** 股息率 = 近 12 个月分红 / 持有市值 */
  dividendYield: number;
  isCash: boolean;
}

/** 单只公司的年度数据集合 */
interface CollectedHistory {
  profitByYear: Record<string, number>;
  equityByYear: Record<string, number>;
  dividendByYear: Record<string, number>;
  taxByYear: Record<string, number>;
  epsByYear: Record<string, number>;
}

/**
 * 按当前持仓股数回溯组合历史业绩（pro-forma）
 *
 * - 每股收益统一按「最新年报股本」折算，规避送转股造成的口径断裂
 * - 归母净利润字段在部分银行股上为 0，用 basicEps × 当年股本兜底
 * - ETF 无归母净利润概念，不参与盈余合计，但计入权重分母
 * - 「按当前市值」的收益率/PE 只是估值快照，不随年份变化
 *
 * @param yearLimit 展示年度数（2~10）
 * @param includeCash 权重与「按当前市值」指标的分母是否包含现金，默认不含
 */
export function usePortfolioHistory(
  yearLimit: MaybeRefOrGetter<number> = HISTORY_YEARS,
  includeCash: MaybeRefOrGetter<boolean> = false,
) {
  const {
    holdings,
    stockHoldingValue,
    cashValue,
    tableData,
    exchangeRate,
    isLoading,
    refresh,
    loadFromStorage,
  } = usePortfolioBase();

  /**
   * 权重与「按当前市值」指标的分母
   * 默认只含股票持仓（ETF 计入），可选含现金；ROE 不使用该分母
   */
  const denominator = computed(
    () => stockHoldingValue.value + (toValue(includeCash) ? cashValue.value : 0),
  );

  const dividendAdjustMap = new Map(
    stocks.map((s) => [s.code, s.dividendAdjust ?? 1]),
  );

  const companies = computed<CompanyHistory[]>(() => {
    const total = denominator.value;
    const result: CompanyHistory[] = [];

    for (const holding of holdings.value) {
      if (holding.isETF) continue;
      result.push(
        buildCompanyHistory(
          holding,
          total > 0 ? holding.holdingValue / total : 0,
          dividendAdjustMap.get(holding.code) ?? 1,
        ),
      );
    }

    return result;
  });

  /**
   * ETF 与现金快照：没有财报，不参与透视盈余与 ROE
   * ETF 分红按近 12 个月（除权日）聚合，避免把历年分红加总成「年分红」
   */
  const cashAndEtf = computed<SnapshotHolding[]>(() => {
    const total = denominator.value;
    const list: SnapshotHolding[] = [];

    for (const holding of holdings.value) {
      if (!holding.isETF) continue;

      const exList =
        tableData.value.find((row) => row.code === holding.code)?.exList ?? [];
      const rawDividend = ttmDividend(exList) * holding.sharesHeld;
      const dividend = canConvertToCNY(holding.code)
        ? rawDividend / exchangeRate.value
        : rawDividend;

      list.push({
        code: holding.code,
        name: holding.name,
        sharesHeld: holding.sharesHeld,
        price: holding.price,
        holdingValue: holding.holdingValue,
        weight: total > 0 ? holding.holdingValue / total : 0,
        dividend,
        dividendYield:
          holding.holdingValue > 0 ? dividend / holding.holdingValue : 0,
        isCash: false,
      });
    }

    if (toValue(includeCash) && cashValue.value > 0) {
      list.push({
        code: "__cash__",
        name: "现金",
        sharesHeld: 0,
        price: 0,
        holdingValue: cashValue.value,
        weight: total > 0 ? cashValue.value / total : 0,
        dividend: 0,
        dividendYield: 0,
        isCash: true,
      });
    }

    return list;
  });

  /** 历史数据覆盖的年度（升序，最多 10 年） */
  const allYears = computed(() => {
    const years = new Set<string>();
    for (const company of companies.value) {
      for (const year of company.years) years.add(year);
    }
    return [...years]
      .sort((a, b) => Number(a) - Number(b))
      .slice(-HISTORY_YEARS);
  });

  const limit = computed(() =>
    Math.min(HISTORY_YEARS, Math.max(2, Math.round(toValue(yearLimit)))),
  );

  const years = computed(() => allYears.value.slice(-limit.value));

  const rows = computed<PortfolioYearRow[]>(() => {
    const total = denominator.value;

    const list = years.value.map<PortfolioYearRow>((year) => {
      let profit = 0;
      let dividend = 0;
      let tax = 0;
      let coveredWeight = 0;
      let roeProfit = 0;
      let equity = 0;

      for (const company of companies.value) {
        const companyProfit = company.profitByYear[year];
        if (companyProfit === undefined) continue;
        profit += companyProfit;
        dividend += company.dividendByYear[year] ?? 0;
        tax += company.taxByYear[year] ?? 0;
        coveredWeight += company.weight;

        // ROE 只在「净利润与净资产同时可得」的公司上计算，避免分子分母错配
        const companyEquity = company.equityByYear[year];
        if (companyEquity !== undefined && companyEquity > 0) {
          roeProfit += companyProfit;
          equity += companyEquity;
        }
      }

      const surplus = profit - tax;
      return {
        year,
        profit,
        surplus,
        equity,
        roe: equity > 0 ? roeProfit / equity : null,
        surplusYield: total > 0 ? surplus / total : 0,
        impliedPE: surplus > 0 ? total / surplus : null,
        dividend,
        tax,
        retained: profit - dividend,
        payoutRatio: profit > 0 ? dividend / profit : null,
        yoy: null,
        coveredWeight,
      };
    });

    for (let i = 1; i < list.length; i += 1) {
      const prev = list[i - 1]!;
      const cur = list[i]!;
      cur.yoy = prev.profit > 0 ? cur.profit / prev.profit - 1 : null;
    }

    return list;
  });

  const latestRow = computed<PortfolioYearRow | null>(
    () => rows.value[rows.value.length - 1] ?? null,
  );

  /** 展示区间内的透视盈余复合增速 */
  const cagr = computed(() => computeCagr(rows.value));

  /** 没有历史数据的持仓（用于提示覆盖权重） */
  const missingCompanies = computed(() =>
    companies.value.filter((c) => !c.hasData),
  );

  /** 有历史数据但既无净资产、也无 ROE 可反推的公司（不参与 ROE） */
  const missingEquityCompanies = computed(() =>
    companies.value.filter(
      (c) => c.hasData && Object.keys(c.equityByYear).length === 0,
    ),
  );

  return {
    companies,
    missingCompanies,
    missingEquityCompanies,
    cashAndEtf,
    allYears,
    rows,
    latestRow,
    cagr,
    holdings,
    stockHoldingValue,
    cashValue,
    /** 当前计算分母（受 includeCash 影响） */
    totalHoldingValue: denominator,
    isLoading,
    refresh,
    loadFromStorage,
  };
}

/**
 * 构建单只持仓的历史业绩
 * @param weight 占当前分母的比例
 * @param dividendAdjust 分红调整系数（<1 表示扣税）
 */
function buildCompanyHistory(
  holding: HoldingBase,
  weight: number,
  dividendAdjust: number,
): CompanyHistory {
  const empty = (): CompanyHistory => ({
    code: holding.code,
    name: holding.name,
    industry: holding.industry,
    sharesHeld: holding.sharesHeld,
    weight,
    hasData: false,
    profitByYear: {},
    equityByYear: {},
    dividendByYear: {},
    taxByYear: {},
    epsByYear: {},
    years: [],
    epsCagr: null,
  });

  const collected = collectHistory(data[holding.code], holding, dividendAdjust);
  if (!collected) return empty();

  return {
    ...empty(),
    hasData: true,
    ...collected,
    years: Object.keys(collected.epsByYear).sort(
      (a, b) => Number(a) - Number(b),
    ),
    epsCagr: computeSeriesCagr(collected.epsByYear),
  };
}

/** 读取并折算单只公司的年度数据，无可用数据时返回 null */
function collectHistory(
  service: (typeof data)[string] | undefined,
  holding: HoldingBase,
  dividendAdjust: number,
): CollectedHistory | null {
  const history = (service?.valuationData?.historyData ?? [])
    .slice()
    .sort((a, b) => Number(a.year) - Number(b.year))
    .slice(-HISTORY_YEARS) as ValuationHistoryData[];

  const latest = history[history.length - 1];
  if (!latest) return null;

  // 以最新年报股本为折算基准：避免历史 EPS 受送转股影响
  const baseShares = resolveShares(latest) ?? findLatestShares(history) ?? 0;

  // 归母净资产按年份索引（数据为期末值）
  const equityMap = new Map<string, number>();
  for (const row of service?.balanceData ?? []) {
    if (row.equity > 0) equityMap.set(row.year, row.equity);
  }

  // 公司披露 ROE（百分数），用于股本缺失时反推应占净资产
  const roeMap = new Map<string, number>();
  for (const row of service?.returnData ?? []) {
    if (row.roe > 0) roeMap.set(row.year, row.roe / 100);
  }

  const collected: CollectedHistory = {
    profitByYear: {},
    equityByYear: {},
    dividendByYear: {},
    taxByYear: {},
    epsByYear: {},
  };

  for (const row of history) {
    let eps: number;
    let dividendPerShare: number;

    if (baseShares > 0) {
      const sharesThatYear = resolveShares(row) ?? baseShares;
      // 部分银行股归母净利润字段为 0，用「基本每股收益 × 当年股本」兜底
      const profit =
        row.profit !== 0 ? row.profit : row.basicEps * sharesThatYear;
      const dividend =
        row.totalDividend > 0 ? row.totalDividend : row.dps * sharesThatYear;
      eps = profit / baseShares;
      dividendPerShare = dividend / baseShares;
    } else {
      // 股本完全缺失（部分银行股）：直接用基本每股收益，不做送转折算
      eps = row.basicEps;
      dividendPerShare = row.dps;
    }

    const holdingDividend = dividendPerShare * holding.sharesHeld;
    const holdingProfit = eps * holding.sharesHeld;
    collected.epsByYear[row.year] = eps;
    collected.profitByYear[row.year] = holdingProfit;
    collected.dividendByYear[row.year] = holdingDividend;
    collected.taxByYear[row.year] = holdingDividend * (1 - dividendAdjust);

    // 应占净资产：优先用「净资产 × 持股数 / 折算股本」
    const equity = equityMap.get(row.year);
    if (equity !== undefined && equity > 0 && baseShares > 0) {
      collected.equityByYear[row.year] =
        (equity * holding.sharesHeld) / baseShares;
      continue;
    }

    // 股本缺失（如银行股）时，用公司披露 ROE 反推：应占净资产 = 应占净利润 / ROE
    const roe = roeMap.get(row.year);
    if (roe !== undefined && roe > 0 && holdingProfit > 0) {
      collected.equityByYear[row.year] = holdingProfit / roe;
    }
  }

  return collected;
}

/** 近 12 个月分红（按除权日聚合，避免把历年分红加总成「年分红」） */
function ttmDividend(exList: ExItem[]): number {
  const now = new Date();
  const from = new Date(now);
  from.setFullYear(now.getFullYear() - 1);

  let sum = 0;
  for (const ex of exList) {
    if (!ex.exDate || ex.exDate === "-") continue;
    const date = new Date(ex.exDate.replace(/\//g, "-"));
    if (Number.isNaN(date.getTime())) continue;
    if (date >= from && date <= now) sum += getEffectiveEventDps(ex);
  }
  return sum;
}

/**
 * 反推当年加权股本
 *
 * 数据里的 totalSharesOutstanding 存在两类问题：银行股为 0；
 * 个别公司（如分众传媒）与真实股本不符。而「归母净利润 / 基本每股收益」
 * 恒等于计算 EPS 所用的加权股本，因此优先用它。
 */
function resolveShares(row: ValuationHistoryData): number | undefined {
  if (row.profit > 0 && row.basicEps > 0) return row.profit / row.basicEps;
  if (row.totalSharesOutstanding > 0) return row.totalSharesOutstanding;
  return undefined;
}

/** 取最近一个非零股本，用于最新年度缺失的情况 */
function findLatestShares(history: ValuationHistoryData[]): number | undefined {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const row = history[i]!;
    const shares = resolveShares(row);
    if (shares && shares > 0) return shares;
  }
  return undefined;
}

/** 按年度首末值计算复合增速 */
function computeSeriesCagr(values: Record<string, number>): number | null {
  const entries = Object.entries(values)
    .filter(([, value]) => value > 0)
    .sort(([a], [b]) => Number(a) - Number(b));
  const first = entries[0];
  const last = entries[entries.length - 1];
  if (!first || !last) return null;

  const span = Number(last[0]) - Number(first[0]);
  if (span <= 0) return null;
  return Math.pow(last[1] / first[1], 1 / span) - 1;
}

function computeCagr(rows: PortfolioYearRow[]): number | null {
  const valid = rows.filter((row) => row.profit > 0);
  const first = valid[0];
  const last = valid[valid.length - 1];
  if (!first || !last) return null;

  const span = Number(last.year) - Number(first.year);
  if (span <= 0) return null;
  return Math.pow(last.profit / first.profit, 1 / span) - 1;
}
