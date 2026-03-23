import {
  type ServiceData,
  ValuationStyle,
  ValuationType,
  type StockItem,
  StockType,
} from "../../types";
import { getStockItem } from "../../types/stocks";
import { computed, ref, type Ref } from "vue";
import { RowType } from "../components/rotation-model/types";
import { data } from "./data";
import { ProfitValuation } from "./profit-valuation";
import { type DynamicData } from "../../fetch-data/types";
import { DividendValuation } from "./dividend-valuation";

// 以 10 年回本进行计算
const BACK_YEARS_NUM = 10;

export class Stock {
  rowType = RowType.STOCK;

  stockType: StockType;

  private stockItem: StockItem;

  private data: ServiceData[string];

  exchangeRate: number;

  anchor = ref(0);

  // 动态数据
  private dynamicData: Ref<DynamicData>;

  loseYield = computed(() => {
    return (
      ((this.anchor.value - this.exchangePrice.value) /
        this.exchangePrice.value) *
      100
    );
  });

  price = computed(() => this.dynamicData.value.price);

  pe = computed(() => {
    return this.dynamicData.value.PE_TTM;
  });

  pb = computed(() => this.dynamicData.value.PB);

  // 股息率
  dividendYield = computed(() => {
    // TODO: 港股价格不正确，未港股股息率进行处理
    if (this.data) {
      const { historyData } = this.data.valuationData;
      const lastData = historyData[historyData.length - 1];
      const { totalDividend } = lastData;
      return (
        totalDividend /
        this.dynamicData.value.totalSharesOutstanding /
        this.price.value
      );
    }
    return 0;
  });

  get waitYears() {
    return 0;
  }

  // 股票名称
  get name() {
    const map: Record<StockType, string> = {
      [StockType.A]: "A",
      [StockType.B]: "B",
      [StockType.HK]: "H",
    };
    return `${map[this.stockItem.type]}${this.stockItem.name}`;
  }

  // 股票代码
  get code() {
    return this.stockItem.code;
  }

  // 当前期望收益
  longTermAverageReturnYield = computed(() => {
    return this.anchor.value / this.exchangePrice.value / BACK_YEARS_NUM;
  });

  // 如果是港币价格需要转换为人民币
  exchangePrice = computed(() => {
    return this.stockType === StockType.A
      ? this.price.value
      : this.price.value / this.exchangeRate;
  });

  // 分红率
  get dividendPayoutRatio() {
    if (this.data) {
      const { historyData } = this.data.valuationData;
      const lastData = historyData[historyData.length - 1];
      const { totalDividend, profit } = lastData;
      if (profit > 0) {
        return totalDividend / profit;
      }
    }
    return 0;
  }

  // 目标仓位
  get allocation() {
    return this.stockItem.allocation;
  }

  // 收集比例
  collectionRatio?: number;

  // 累计收集
  cumulativeRatio?: number;

  // 目标仓位股数
  allocationShares?: number;

  // 收集比例股数
  collectionRatioShares?: number;

  // 目标仓位市值
  allocationValue?: number;

  // 收集比例市值
  collectionRatioValue?: number;

  // 累计收集股数
  cumulativeRatioShares?: number;

  // 累计收集市值
  cumulativeRatioValue?: number;

  // 理论累计收集股数
  theoreticalShares?: number;

  // 理论累计收集市值
  theoreticalValue?: number;

  // 一手股数
  get sharesPerLot() {
    return this.stockItem.sharesPerLot || 100;
  }

  constructor(
    stockItem: StockItem,
    dynamicData: DynamicData,
    exchangeRate: number,
    valuationStyle: ValuationStyle = ValuationStyle.NEUTRAL,
  ) {
    this.stockItem = stockItem;
    this.stockType = stockItem.type;
    this.data = data[stockItem.code];
    this.dynamicData = ref(dynamicData);
    this.exchangeRate = exchangeRate;
    this.calculateAnchor(valuationStyle);
  }

  async calculateAnchor(
    valuationStyle: ValuationStyle = ValuationStyle.NEUTRAL,
  ) {
    const stockItem = getStockItem(this.stockItem.code);

    const { valuationConfig } = this.stockItem;

    // TODO: 利润估值目前只支持A股
    // TODO: HKMarketValuation
    if (
      stockItem.type === StockType.A &&
      valuationConfig.type === ValuationType.PROFIT
    ) {
      const valuationData = data[this.stockItem.code].valuationData;
      const dynamicData = data[this.stockItem.code].dynamicData;

      const profitValuation = new ProfitValuation(
        valuationData,
        stockItem,
        dynamicData,
        valuationConfig[valuationStyle],
      );

      this.anchor.value = profitValuation.anchor.value;
    } else if (valuationConfig.type === ValuationType.DIVIDEND) {
      const valuationData = data[this.stockItem.code].valuationData;
      const dynamicData = data[this.stockItem.code].dynamicData;

      const dividendValuation = new DividendValuation(
        valuationData,
        valuationConfig,
        dynamicData,
      );
      this.anchor.value = dividendValuation.anchor;
    } else if (valuationConfig.type === ValuationType.DIRECT) {
      // 这里的价格是人民币
      this.anchor.value = valuationConfig.price;
    } else if (valuationConfig.type === ValuationType.REFERENCE) {
      // 这里的价格是人民币
      this.anchor.value = valuationConfig.price;
    } else {
      console.log("找不到估值方法");
    }
  }

  setCollectionRatio(val?: number) {
    this.collectionRatio = val;
  }

  setCumulativeRatio(val?: number) {
    this.cumulativeRatio = val;
  }

  // 计算目标仓位的股数，totalAmount 是 RMB
  calculateAllocationShares(totalAmount: number) {
    const amount = this.allocation * totalAmount;
    const shares = Math.floor(amount / this.exchangePrice.value);
    const lots = Math.floor(shares / this.sharesPerLot);
    return lots * this.sharesPerLot;
  }

  // 计算收集比例的股数，totalAmount 是 RMB
  calculateCollectionRatioShares(totalAmount: number) {
    if (this.collectionRatio === undefined || this.collectionRatio === 0) {
      return undefined;
    }
    // 投入的金额
    const amount = this.collectionRatio * totalAmount;
    // 相应的股数
    const shares = Math.floor(amount / this.exchangePrice.value);
    // 可以买多少手
    const lots = Math.floor(shares / this.sharesPerLot);
    // 转换为股数
    return lots * this.sharesPerLot;
  }

  // 计算累计收集的股数
  calculateCumulativeRatioShares(totalAmount: number) {
    if (this.cumulativeRatio === undefined || this.cumulativeRatio === 0) {
      return undefined;
    }
    // 投入的金额
    const amount = this.cumulativeRatio * totalAmount;
    // 相应的股数
    const shares = Math.floor(amount / this.exchangePrice.value);
    // 可以买多少手
    const lots = Math.floor(shares / this.sharesPerLot);
    // 转换为股数
    return lots * this.sharesPerLot;
  }

  // 设置所有股数
  setAllShares(totalAmount: number) {
    this.allocationShares = this.calculateAllocationShares(totalAmount);

    // 收集比例的股数
    this.collectionRatioShares =
      this.calculateCollectionRatioShares(totalAmount);
    // 累计收集的股数
    this.cumulativeRatioShares =
      this.calculateCumulativeRatioShares(totalAmount);

    this.allocationValue = this.allocationShares * this.exchangePrice.value;
    this.collectionRatioValue = this.collectionRatioShares
      ? this.collectionRatioShares * this.exchangePrice.value
      : undefined;
    this.cumulativeRatioValue = this.cumulativeRatioShares
      ? this.cumulativeRatioShares * this.exchangePrice.value
      : undefined;
  }

  // totalAmount 是投入金额
  // ratio 是当前位置需要收集的比例
  calculateTheoretical(totalAmount: number, ratio: number) {
    this.theoreticalValue = totalAmount * ratio * this.allocation;
    this.theoreticalShares = this.theoreticalValue / this.exchangePrice.value;
  }

  // 更新动态数据
  updateDynamicData(dynamicData: DynamicData) {
    this.dynamicData.value = dynamicData;
  }
}
