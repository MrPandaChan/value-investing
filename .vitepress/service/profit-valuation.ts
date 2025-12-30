import {
  ProfitValuationGrowthType,
  type ValuationHistoryData,
  type ProfitValuationGrowth,
  type StockItem,
  type ValuationData,
} from "../../types";
import { computed, ref } from "vue";
import {
  formatNum,
  formatPercent,
  numToAHundredMillion,
  presentValue,
} from "../../fetch-data/helper";
import { type DynamicData } from "../../fetch-data/types";
import {
  getDynamicData,
  getExchangeRate,
} from "../../fetch-data/fetch-stock-data";

// 财务自由的一个普遍定义，是总投资资产，每年提取4%足够生活开支了，就达到了基础的财务自由。就不需要为了生活而被迫去做不想做的事情，或者至少有了更多的选择权。
const DISCOUNT_RATE = 0.04;

export interface ProfitValuationFutureData {
  year: number;
  profit: number;
  displayProfit: number;
  growth: number;
  displayGrowth: number;
  eps: number;
  displayEps: number;
}

export class ProfitValuation {
  growth = ref<Required<ProfitValuationGrowth>>({
    type: ProfitValuationGrowthType.RATE,
    data: [],
    discount: 1,
  });

  // 上一年利润
  private prevYearProfit: number;

  // 上一年年份
  private prevYear: number;

  // 每股现金
  cashPerShare: number;

  // 去有息负债现金
  netDebtCash: number;

  // 去有息每股现金
  netDebtCashPerShare: number;

  // 合计每股金融资产
  totalFinancialAssetsPerShare: number;

  // 每股少数股东权益
  minorityInterestPerShare: number;

  price = 0;

  hkMarketValuation = ref<HKMarketValuation | null>(null);

  dynamicData: DynamicData;

  stockItem: StockItem;

  lastData: ValuationHistoryData;

  valuationData: ValuationData;

  tableData = ref<ProfitValuationFutureData[]>([]);

  totalSharesOutstanding: number;

  backYearsNum = ref<number>(10);

  calBackYearsNum = computed(() => this.backYearsNum.value - 1);

  discount = computed(() => {
    return this.growth.value.discount;
  });

  // 折现后 n 年利润
  sumPresentEps = computed(() => {
    const lastYearEps = this.prevYearProfit / this.totalSharesOutstanding;

    const rest = this.calBackYearsNum.value % 1;
    const years = Math.floor(this.calBackYearsNum.value);
    let sum = 0;
    for (let i = 0; i < years; i += 1) {
      sum += presentValue(this.tableData.value[i].eps, DISCOUNT_RATE, i);
    }
    if (rest > 0) {
      sum += presentValue(
        rest * this.tableData.value[years].eps,
        DISCOUNT_RATE,
        years
      );
    }
    return formatNum(lastYearEps + sum, 2);
  });

  // 折线后每股利润/年
  presetEps = computed(() => {
    return formatNum(this.sumPresentEps.value / this.backYearsNum.value, 2);
  });

  // 合计未来 n 年 eps
  sumEps = computed(() => {
    const lastYearEps = this.prevYearProfit / this.totalSharesOutstanding;

    const rest = this.calBackYearsNum.value % 1;
    const years = Math.floor(this.calBackYearsNum.value);
    let sum = 0;
    for (let i = 0; i < years; i += 1) {
      sum += this.tableData.value[i].eps;
    }
    if (rest > 0) {
      sum += rest * this.tableData.value[years].eps;
    }
    return formatNum(lastYearEps + sum, 2);
  });

  // 锚点
  anchor = computed(() => {
    return this.sumEps.value * this.discount.value;
  });

  // 其它资产每股价值
  otherAssets = computed(() => {
    // 100% 去有息负债现金 + 75% 可交易金融资产 + 50% 长期股权投资
    const other =
      (this.netDebtCash +
        0.75 * this.valuationData.tradingFinancialAssets +
        0.5 * this.valuationData.longTermEquityInvestment) /
      this.dynamicData.totalSharesOutstanding;

    // 减去少数股东权益
    const result = other - this.minorityInterestPerShare;
    return result * this.discount.value;
  });

  // 加其它资产锚点
  anchorWithAssets = computed(() => {
    return this.anchor.value + this.otherAssets.value;
  });

  // 折现后锚点
  presentAnchor = computed(() => {
    return this.sumPresentEps.value * this.discount.value;
  });

  // 折现后锚点（加其它资产）
  presentAnchorWithAssets = computed(() => {
    return this.presentAnchor.value + this.otherAssets.value;
  });

  // 击球区边缘
  battingEdge = computed(() => formatNum(this.anchor.value * 1.05, 2));

  // 加其它资产锚点击球区边缘
  anchorWithAssetsEdge = computed(() =>
    formatNum(this.anchorWithAssets.value * 1.05, 2)
  );

  // 还可以跌
  couldFallAnother = computed(() => {
    const percent = ((this.price - this.anchor.value) / this.price) * 100;
    return formatPercent(-percent);
  });

  // 加其它资产锚点还可以跌
  couldFallAnotherWithAssets = computed(() => {
    const percent =
      ((this.price - this.anchorWithAssets.value) / this.price) * 100;
    return formatPercent(-percent);
  });

  // 当前股价长期平均收益率
  longTermAverageReturnYieldWithPrice = computed(() => {
    const result = this.anchor.value / this.price / this.backYearsNum.value;
    return formatPercent(result * 100);
  });

  // 当前股价长期平均收益率（加其它资产）
  longTermWithAssets = computed(() => {
    const result =
      this.anchor.value /
      (this.price - this.otherAssets.value) /
      this.backYearsNum.value;
    return formatPercent(result * 100);
  });

  // 预期锚点收益率
  longTermAverageReturnYieldWithAnchor = computed(() => {
    const result = 1 / this.backYearsNum.value;
    return formatPercent(result * 100);
  });

  // 折现后长期平均收益率
  longTermAverageReturnYieldWithPresent = computed(() => {
    const result =
      this.presentAnchor.value / this.price / this.backYearsNum.value;
    return formatPercent(result * 100);
  });

  // 折现后长期平均收益率（加其它资产）
  longTermPresentWithAssets = computed(() => {
    const result =
      this.presentAnchor.value /
      (this.price - this.otherAssets.value) /
      this.backYearsNum.value;
    return formatPercent(result * 100);
  });

  /**
   * A 和 H 可能略有不同？
   */
  dividendRate = computed(() => {
    const { totalDividend } =
      this.valuationData.historyData[this.valuationData.historyData.length - 1];
    return (
      numToAHundredMillion(totalDividend, 8) /
      this.totalSharesOutstanding /
      this.price
    );
  });

  constructor(
    valuationData: ValuationData,
    stockItem: StockItem,
    dynamicData: DynamicData,
    growth?: ProfitValuationGrowth
  ) {
    if (growth) {
      this.growth.value = {
        type: growth.type,
        data: growth.data,
        discount: typeof growth.discount === "number" ? growth.discount : 1,
      };
    }

    if (stockItem.profitValuationConfig) {
      this.backYearsNum.value = stockItem.profitValuationConfig.backYearsNum;
    }

    this.stockItem = stockItem;
    this.valuationData = valuationData;

    this.lastData =
      valuationData.historyData[valuationData.historyData.length - 1];

    this.prevYearProfit = numToAHundredMillion(this.lastData.profit, 8);
    this.prevYear = Number(this.lastData.year);

    this.totalSharesOutstanding = numToAHundredMillion(
      dynamicData.totalSharesOutstanding,
      8
    );

    this.price = dynamicData.price;

    this.dynamicData = dynamicData;

    this.cashPerShare = formatNum(
      valuationData.cash / dynamicData.totalSharesOutstanding,
      2
    );

    // 计算去有息负债现金
    this.netDebtCash = valuationData.cash - valuationData.interestBearingDebt;

    // 计算去有息每股现金
    this.netDebtCashPerShare =
      this.netDebtCash / dynamicData.totalSharesOutstanding;

    // 计算合计每股金融资产
    this.totalFinancialAssetsPerShare =
      (valuationData.tradingFinancialAssets +
        valuationData.longTermEquityInvestment) /
      dynamicData.totalSharesOutstanding;

    // 计算每股少数股东权益
    this.minorityInterestPerShare =
      valuationData.minorityInterest / dynamicData.totalSharesOutstanding;

    this.init();
    this.initTable();
  }

  async init() {
    if (this.stockItem.bMarketConfig || this.stockItem.hkMarketConfig) {
      this.hkMarketValuation.value = await HKMarketValuation.create(this);
    }
  }

  sellPrice(rate: number) {
    return this.anchor.value / rate / this.backYearsNum.value;
  }

  sellPriceWithAssets(rate: number) {
    return this.sellPrice(rate) + this.otherAssets.value;
  }

  initTable() {
    const data: ProfitValuationFutureData[] = [];
    let prevProfit = this.prevYearProfit;

    for (let i = 0; i < 20; i += 1) {
      let growthRate = 0;
      let profit = 0;
      const growth = this.growth.value;

      // 按增长率推算
      if (growth.type === ProfitValuationGrowthType.RATE) {
        growthRate = growth.data[i] ?? growth.data[growth.data.length - 1] ?? 0;
        profit = prevProfit * (1 + growthRate);
      }
      // 按利润推算
      else if (growth.type === ProfitValuationGrowthType.PROFIT) {
        profit = growth.data[i] ?? growth.data[i - 1] ?? prevProfit;
        growthRate = (profit - prevProfit) / prevProfit;
      }

      const eps = profit / this.totalSharesOutstanding;
      const profitValue = profit;
      const growthValue = growthRate * 100;

      data.push({
        year: this.prevYear + i + 1,
        profit: profitValue,
        displayProfit: formatNum(profitValue, 2),
        growth: growthValue,
        displayGrowth: formatNum(growthValue, 2),
        eps,
        displayEps: formatNum(eps, 2),
      });

      prevProfit = profit;
    }

    this.tableData.value = data;
  }

  handleFocus(
    row: ProfitValuationFutureData,
    displayKey: keyof ProfitValuationFutureData,
    rawKey: keyof ProfitValuationFutureData
  ) {
    row[displayKey] = row[rawKey];
  }

  dynamicPE(row: ProfitValuationFutureData) {
    return formatNum(this.price / row.eps, 2);
  }

  handleBlur(
    row: ProfitValuationFutureData,
    displayKey: keyof ProfitValuationFutureData,
    rawKey: keyof ProfitValuationFutureData
  ) {
    const num = formatNum(row[rawKey], 2);
    if (!isNaN(num)) {
      row[displayKey] = Math.floor(num * 100) / 100;
    } else {
      row[displayKey] = row[rawKey];
    }
  }

  updateCell(
    index: number,
    field: keyof ProfitValuationFutureData,
    event: Event
  ) {
    let value = 0;
    if (event.target instanceof HTMLInputElement) {
      value = parseFloat(event.target.value);
    }
    if (typeof value !== "number") return;

    const row = this.tableData.value[index];
    const prevProfit =
      index === 0
        ? this.prevYearProfit
        : this.tableData.value[index - 1].profit;

    // 根据修改的字段重新计算
    switch (field) {
      case "profit":
        // 修改净利润 → 计算增长率和每股收益
        row.profit = value;
        row.displayProfit = value; // 实时显示原始输入
        row.growth = prevProfit ? ((value - prevProfit) / prevProfit) * 100 : 0;
        row.displayGrowth = formatNum(row.growth, 2);
        row.eps = this.totalSharesOutstanding
          ? value / this.totalSharesOutstanding
          : 0;
        row.displayEps = formatNum(row.eps, 2);
        break;

      case "growth":
        // 修改增长率 → 计算净利润和每股收益
        row.growth = value;
        row.displayGrowth = value;
        row.profit = prevProfit * (1 + value / 100);
        row.displayProfit = formatNum(row.profit, 2);
        row.eps = this.totalSharesOutstanding
          ? row.profit / this.totalSharesOutstanding
          : 0;
        row.displayEps = formatNum(row.eps, 2);
        break;

      case "eps":
        // 修改每股收益 → 计算净利润和增长率
        row.eps = value;
        row.displayEps = value;
        row.profit = value * this.totalSharesOutstanding;
        row.displayProfit = formatNum(row.profit, 2);
        row.growth = prevProfit
          ? ((row.profit - prevProfit) / prevProfit) * 100
          : 0;
        row.displayEps = formatNum(row.growth, 2);
        break;
    }

    // 更新当前行后，重新计算后续所有行(增长率不受影响，因此不计算)
    this.recalculateFrom(index + 1);

    this.recalculateOther();
  }

  // 从指定行开始重新计算后续所有行(增长率不受影响，因此不计算)
  recalculateFrom(startIndex: number) {
    let prevProfit =
      startIndex === 0
        ? this.prevYearProfit
        : this.tableData.value[startIndex - 1].profit;

    for (let i = startIndex; i < this.tableData.value.length; i++) {
      const row = this.tableData.value[i];
      row.profit = prevProfit * (1 + row.growth / 100);
      row.displayProfit = formatNum(row.profit, 2);
      row.eps = this.totalSharesOutstanding
        ? row.profit / this.totalSharesOutstanding
        : 0;
      row.displayEps = formatNum(row.eps, 2);

      prevProfit = row.profit;
    }
  }

  recalculateOther() {
    let sumDiscountingProfit = 0;
    let sumDividend = 0;

    for (let i = 0; i < this.tableData.value.length; i++) {
      const row = this.tableData.value[i];

      //
    }
  }
}

export class HKMarketValuation {
  exchangeRate: number;

  profitValuation: ProfitValuation;

  price: number;

  discount = 1;

  dividendTaxRate = 1;

  CHN: number;

  // 锚点
  anchor = computed(() => {
    return (
      (this.profitValuation.anchor.value / this.exchangeRate) * this.discount
    );
  });

  // 加其它资产锚点
  anchorWithAssets = computed(() => {
    return (
      (this.profitValuation.anchorWithAssets.value / this.exchangeRate) *
      this.discount
    );
  });

  // 还可以跌
  couldFallAnother = computed(() => {
    const percent = ((this.price - this.anchor.value) / this.price) * 100;
    return formatPercent(-percent);
  });

  // 边缘还可以跌
  battingEdgeCouldFallAnother = computed(() => {
    const percent = ((this.price - this.battingEdge.value) / this.price) * 100;
    return formatPercent(-percent);
  });

  // 加其它资产锚点还可以跌
  couldFallAnotherWithAssets = computed(() => {
    const percent =
      ((this.price - this.anchorWithAssets.value) / this.price) * 100;
    return formatPercent(-percent);
  });

  // 当前股价长期平均收益率
  longTermAverageReturnYieldWithPrice = computed(() => {
    const result =
      this.profitValuation.anchor.value /
      this.CHN /
      this.profitValuation.backYearsNum.value;
    return formatPercent(result * 100);
  });

  // 折现后长期平均收益率
  longTermAverageReturnYieldWithPresent = computed(() => {
    const result =
      this.profitValuation.presentAnchor.value /
      this.CHN /
      this.profitValuation.backYearsNum.value;
    return formatPercent(result * 100);
  });

  // 击球区边缘
  battingEdge = computed(() => formatNum(this.anchor.value * 1.05, 2));

  // 加其它资产锚点击球区边缘
  anchorWithAssetsEdge = computed(() =>
    formatNum(this.anchorWithAssets.value * 1.05, 2)
  );

  // 当前股价长期平均收益率（加其它资产）
  longTermWithAssets = computed(() => {
    const result =
      this.profitValuation.anchorWithAssets.value /
      this.CHN /
      this.profitValuation.backYearsNum.value;
    return formatPercent(result * 100);
  });

  // 折现后长期平均收益率（加其它资产）
  longTermPresentWithAssets = computed(() => {
    const result =
      this.profitValuation.presentAnchorWithAssets.value /
      this.CHN /
      this.profitValuation.backYearsNum.value;
    return formatPercent(result * 100);
  });

  dps = computed(() => {
    const { totalDividend } =
      this.profitValuation.valuationData.historyData[
        this.profitValuation.valuationData.historyData.length - 1
      ];
    return (
      (numToAHundredMillion(totalDividend, 8) /
        this.profitValuation.totalSharesOutstanding /
        this.exchangeRate) *
      this.dividendTaxRate
    );
  });

  dividendRate = computed(() => {
    const { totalDividend } =
      this.profitValuation.valuationData.historyData[
        this.profitValuation.valuationData.historyData.length - 1
      ];
    return (
      (numToAHundredMillion(totalDividend, 8) /
        this.profitValuation.totalSharesOutstanding /
        this.CHN) *
      this.dividendTaxRate
    );
  });

  anchorDividendRate = computed(() => {
    return this.dps.value / this.anchor.value;
  });

  anchorWithAssetsDividendRate = computed(() => {
    return this.dps.value / this.anchorWithAssets.value;
  });

  dividendCompare = computed(() => {
    return this.profitValuation.dividendRate.value - this.dividendRate.value;
  });

  constructor(
    profitValuation: ProfitValuation,
    exchangeRate: number,
    price: number
  ) {
    this.profitValuation = profitValuation;
    this.exchangeRate = 1 / exchangeRate;
    this.price = price;
    this.CHN = price / exchangeRate; // 港币换算人民币
    if (profitValuation.stockItem.hkMarketConfig) {
      this.discount = profitValuation.stockItem.hkMarketConfig.discount ?? 0.8;
      this.dividendTaxRate =
        profitValuation.stockItem.hkMarketConfig.dividendTaxRate ?? 1;
    } else if (profitValuation.stockItem.bMarketConfig) {
      this.discount = profitValuation.stockItem.bMarketConfig?.discount ?? 1;
    }
  }

  static async create(profitValuation: ProfitValuation) {
    const config =
      profitValuation.stockItem.hkMarketConfig ||
      profitValuation.stockItem.bMarketConfig;
    try {
      const [{ price }, { price: exchangeRate }] = await getDynamicData([
        config!.code,
        "133.CNHHKD",
      ]);
      return new HKMarketValuation(profitValuation, exchangeRate / 100, price);
    } catch (error) {
      console.error(error);
    }
  }
}
