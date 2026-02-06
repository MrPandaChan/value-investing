import { type ServiceData, type StockItem } from "../../types";
import { getStockItem } from "../../types/stocks";
import { computed, ref, type Ref } from "vue";
import { RowType } from "../components/rotation-model/types";
import { data } from "./data";
import { ProfitValuation } from "./profit-valuation";

// 以 10 年回本进行计算
const BACK_YEARS_NUM = 10;

export class Stock {
  rowType = RowType.STOCK;

  private stockItem: StockItem;

  private data: ServiceData[string];

  anchor = ref(0);

  price: Ref<number>;

  loseYield = computed(() => {
    return ((this.anchor.value - this.price.value) / this.price.value) * 100;
  });

  get waitYears() {
    return 0;
  }

  // 股票名称
  get name() {
    return this.stockItem.name;
  }

  // PE
  get pe() {
    return this.data.dynamicData.PE;
  }

  // PB
  get pb() {
    return this.data.dynamicData.PB;
  }

  // 当前期望收益
  longTermAverageReturnYield = computed(() => {
    return this.anchor.value / this.price.value / BACK_YEARS_NUM;
  });

  // 股息率
  get dividendYield() {
    const { historyData } = this.data.valuationData;
    const lastData = historyData[historyData.length - 1];
    const { totalDividend } = lastData;
    return (
      totalDividend /
      this.data.dynamicData.totalSharesOutstanding /
      this.price.value
    );
  }

  // 分红率
  get dividendPayoutRatio() {
    const { historyData } = this.data.valuationData;
    const lastData = historyData[historyData.length - 1];
    const { totalDividend, profit } = lastData;
    return totalDividend / profit;
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

  // 累计收集股数
  cumulativeRatioShares?: number;

  // 目标仓位市值
  allocationValue?: number;

  // 收集比例市值
  collectionRatioValue?: number;

  // 累计收集市值
  cumulativeRatioValue?: number;

  // 一手股数
  get sharesPerLot() {
    return this.stockItem.sharesPerLot || 100;
  }

  constructor(stockItem: StockItem) {
    this.stockItem = stockItem;
    this.data = data[stockItem.code];
    this.price = ref(this.data.dynamicData.price);

    this.calculateAnchor();
  }

  private calculateAnchor() {
    const valuationData = data[this.stockItem.code].valuationData;
    const dynamicData = data[this.stockItem.code].dynamicData;
    const stockItem = getStockItem(this.stockItem.code);

    const profitValuation = new ProfitValuation(
      valuationData,
      stockItem,
      dynamicData,
      this.stockItem.profitValuationConfig?.neutral,
    );

    this.anchor.value = profitValuation.anchor.value;
  }

  setCollectionRatio(val?: number) {
    this.collectionRatio = val;
  }

  setCumulativeRatio(val?: number) {
    this.cumulativeRatio = val;
  }

  // 计算目标仓位的股数
  calculateAllocationShares(totalAmount: number) {
    const amount = this.allocation * totalAmount;
    const shares = Math.floor(amount / this.price.value);
    const lots = Math.floor(shares / this.sharesPerLot);
    return lots * this.sharesPerLot;
  }

  // 计算收集比例的股数
  calculateCollectionRatioShares(totalAmount: number) {
    if (this.collectionRatio === undefined || this.collectionRatio === 0) {
      return undefined;
    }
    const amount = this.collectionRatio * totalAmount;
    const shares = Math.floor(amount / this.price.value);
    const lots = Math.floor(shares / this.sharesPerLot);
    return lots * this.sharesPerLot;
  }

  // 计算累计收集的股数
  calculateCumulativeRatioShares(totalAmount: number) {
    if (this.cumulativeRatio === undefined || this.cumulativeRatio === 0) {
      return undefined;
    }
    const amount = this.cumulativeRatio * totalAmount;
    const shares = Math.floor(amount / this.price.value);
    const lots = Math.floor(shares / this.sharesPerLot);
    return lots * this.sharesPerLot;
  }

  // 设置所有股数
  setAllShares(totalAmount: number) {
    this.allocationShares = this.calculateAllocationShares(totalAmount);
    this.collectionRatioShares =
      this.calculateCollectionRatioShares(totalAmount);
    this.cumulativeRatioShares =
      this.calculateCumulativeRatioShares(totalAmount);
    this.allocationValue = this.allocationShares * this.price.value;
    this.collectionRatioValue = this.collectionRatioShares
      ? this.collectionRatioShares * this.price.value
      : undefined;
    this.cumulativeRatioValue = this.cumulativeRatioShares
      ? this.cumulativeRatioShares * this.price.value
      : undefined;
  }
}
